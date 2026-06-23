#include <JuceHeader.h>
#include "HostWindow.h"
#include <iostream>
#include <thread>

class VstHostApp : public juce::JUCEApplication
{
public:
    VstHostApp() {}
    
    const juce::String getApplicationName() override { return "VST Juce Host"; }
    const juce::String getApplicationVersion() override { return "1.0.0"; }
    bool moreThanOneInstanceAllowed() override { return true; }

    void initialise(const juce::String&) override
    {
        formatManager.registerBasicFormats();
        pluginFormatManager.addDefaultFormats();
        
        mainWindow = std::make_unique<HostWindow>("VST Plugin");
        
        inputThread = std::thread([this]() { runInputLoop(); });
    }

    void shutdown() override
    {
        // Close thread
        if (inputThread.joinable())
        {
            // Close stdin or use a kill switch (not cleanly possible with blocking std::getline, but OS will kill it)
            inputThread.detach(); 
        }
            
        mainWindow = nullptr;
        pluginInstance = nullptr;
    }
    
    void runInputLoop()
    {
        std::string line;
        while (std::getline(std::cin, line))
        {
            if (line == "exit" || line == "quit")
            {
                juce::MessageManager::callAsync([]() { juce::JUCEApplication::quit(); });
                break;
            }
            
            auto json = juce::JSON::parse(line);
            if (json.isObject())
            {
                auto command = json.getProperty("command", "").toString();
                if (command == "load")
                {
                    auto path = json.getProperty("path", "").toString();
                    juce::MessageManager::callAsync([this, path]() { loadPlugin(path); });
                }
                else if (command == "show_editor")
                {
                    juce::MessageManager::callAsync([this]() { showEditor(); });
                }
                else if (command == "hide_editor")
                {
                    juce::MessageManager::callAsync([this]() { hideEditor(); });
                }
                else if (command == "process")
                {
                    auto inPath = json.getProperty("in", "").toString();
                    auto outPath = json.getProperty("out", "").toString();
                    juce::MessageManager::callAsync([this, inPath, outPath]() { processAudio(inPath, outPath); });
                }
            }
        }
    }

    void loadPlugin(const juce::String& path)
    {
        juce::OwnedArray<juce::PluginDescription> typesFound;
        for (int i = 0; i < pluginFormatManager.getNumFormats(); ++i)
        {
            auto* format = pluginFormatManager.getFormat(i);
            if (format->getName() == "VST3")
            {
                format->findAllTypesForFile(typesFound, path);
                break;
            }
        }
        
        juce::String errorMessage;
        juce::DynamicObject::Ptr response = new juce::DynamicObject();
        response->setProperty("command", "load");
        
        if (!typesFound.isEmpty())
        {
            pluginInstance = pluginFormatManager.createPluginInstance(*typesFound[0], 44100.0, 512, errorMessage);
            if (pluginInstance != nullptr)
            {
                response->setProperty("success", true);
                response->setProperty("name", pluginInstance->getName());
            }
            else
            {
                response->setProperty("success", false);
                response->setProperty("error", errorMessage.isEmpty() ? "Failed to instantiate" : errorMessage);
            }
        }
        else
        {
            response->setProperty("success", false);
            response->setProperty("error", "Failed to parse VST3 plugin file");
        }
        std::cout << juce::JSON::toString(juce::var(response), true).toStdString() << std::endl;
    }
    
    void showEditor()
    {
        juce::DynamicObject::Ptr response = new juce::DynamicObject();
        response->setProperty("command", "show_editor");
        if (pluginInstance != nullptr && pluginInstance->hasEditor())
        {
            auto* editor = pluginInstance->createEditorIfNeeded();
            mainWindow->setName(pluginInstance->getName());
            mainWindow->setEditor(editor);
            response->setProperty("success", true);
        }
        else
        {
            response->setProperty("success", false);
            response->setProperty("error", "No editor available");
        }
        std::cout << juce::JSON::toString(juce::var(response), true).toStdString() << std::endl;
    }
    
    void hideEditor()
    {
        juce::DynamicObject::Ptr response = new juce::DynamicObject();
        response->setProperty("command", "hide_editor");
        mainWindow->setEditor(nullptr);
        mainWindow->setVisible(false);
        response->setProperty("success", true);
        std::cout << juce::JSON::toString(juce::var(response), true).toStdString() << std::endl;
    }
    
    void processAudio(const juce::String& inPath, const juce::String& outPath)
    {
        juce::DynamicObject::Ptr response = new juce::DynamicObject();
        response->setProperty("command", "process");

        if (pluginInstance == nullptr)
        {
            response->setProperty("success", false);
            response->setProperty("error", "No plugin loaded");
            std::cout << juce::JSON::toString(juce::var(response), true).toStdString() << std::endl;
            return;
        }

        juce::File inFile(inPath);
        juce::File outFile(outPath);
        
        std::unique_ptr<juce::AudioFormatReader> reader(formatManager.createReaderFor(inFile));
        if (reader == nullptr)
        {
            response->setProperty("success", false);
            response->setProperty("error", "Could not read input wav");
            std::cout << juce::JSON::toString(juce::var(response), true).toStdString() << std::endl;
            return;
        }
        
        juce::AudioBuffer<float> buffer(reader->numChannels, (int)reader->lengthInSamples);
        reader->read(&buffer, 0, (int)reader->lengthInSamples, 0, true, true);
        
        juce::MidiBuffer midiMessages;
        pluginInstance->prepareToPlay(reader->sampleRate, buffer.getNumSamples());
        pluginInstance->processBlock(buffer, midiMessages);
        
        juce::WavAudioFormat wavFormat;
        std::unique_ptr<juce::AudioFormatWriter> writer(wavFormat.createWriterFor(new juce::FileOutputStream(outFile),
                                                                                  reader->sampleRate,
                                                                                  buffer.getNumChannels(),
                                                                                  16,
                                                                                  {}, 0));
        if (writer != nullptr)
        {
            writer->writeFromAudioSampleBuffer(buffer, 0, buffer.getNumSamples());
            response->setProperty("success", true);
        }
        else
        {
            response->setProperty("success", false);
            response->setProperty("error", "Could not write output wav");
        }
        std::cout << juce::JSON::toString(juce::var(response), true).toStdString() << std::endl;
    }

private:
    std::unique_ptr<HostWindow> mainWindow;
    std::unique_ptr<juce::AudioPluginInstance> pluginInstance;
    juce::AudioFormatManager formatManager;
    juce::AudioPluginFormatManager pluginFormatManager;
    
    std::thread inputThread;
};

START_JUCE_APPLICATION(VstHostApp)
