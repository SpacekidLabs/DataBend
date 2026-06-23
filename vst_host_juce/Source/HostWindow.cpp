#include "HostWindow.h"

HostWindow::HostWindow(const juce::String& name)
    : DocumentWindow(name,
                     juce::Desktop::getInstance().getDefaultLookAndFeel()
                         .findColour(juce::ResizableWindow::backgroundColourId),
                     DocumentWindow::allButtons)
{
    setUsingNativeTitleBar(true);
    setResizable(true, false);
}

HostWindow::~HostWindow()
{
    if (pluginEditor != nullptr)
        setContentOwned(nullptr, false);
}

void HostWindow::closeButtonPressed()
{
    setVisible(false);
}

void HostWindow::setEditor(juce::AudioProcessorEditor* editor)
{
    pluginEditor.reset(editor);
    if (editor != nullptr)
    {
        setContentNonOwned(editor, true);
        centreWithSize(editor->getWidth(), editor->getHeight());
        setVisible(true);
        toFront(true);
        juce::Process::makeForegroundProcess();
    }
    else
    {
        setContentOwned(nullptr, false);
        setVisible(false);
    }
}
