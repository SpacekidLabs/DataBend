#pragma once
#include <JuceHeader.h>

class HostWindow : public juce::DocumentWindow
{
public:
    HostWindow(const juce::String& name);
    ~HostWindow() override;

    void closeButtonPressed() override;
    void setEditor(juce::AudioProcessorEditor* editor);

private:
    std::unique_ptr<juce::AudioProcessorEditor> pluginEditor;
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(HostWindow)
};
