cmake_minimum_required(VERSION 3.22)
project(VSTJuceHost VERSION 1.0.0)

add_subdirectory(JUCE)

juce_add_gui_app(vst_juce_host
    PRODUCT_NAME "VST Juce Host"
    VERSION 1.0.0)

juce_generate_juce_header(vst_juce_host)

target_sources(vst_juce_host
    PRIVATE
        Source/Main.cpp
        Source/HostWindow.cpp
        Source/HostWindow.h)

target_compile_definitions(vst_juce_host
    PUBLIC
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_PLUGINHOST_VST3=1
        JUCE_PLUGINHOST_AU=1)

target_link_libraries(vst_juce_host
    PRIVATE
        juce::juce_audio_processors
        juce::juce_audio_formats
        juce::juce_audio_utils
        juce::juce_gui_extra
        juce::juce_gui_basics
        juce::juce_events
        juce::juce_core)
