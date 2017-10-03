/**
 * Main application view.
 * @namespace WH
 */

window.WH = window.WH || {};

(function (ns) {
    
    function createAppView(specs, my) {
        var that,
            app = specs.app,
            midiNetwork = specs.midiNetwork,
            rootEl = document.querySelector('#app'),
            panelsEl = document.querySelector('.panels'),
            helpEl = document.querySelector('.help'),
            prefsEl = document.querySelector('.prefs'),
            editEl = document.querySelector('.edit'),
            editContentEl = document.querySelector('.edit .panel__content'),
            remoteEl = document.querySelector('.remote'),
            settingsViews = [],
            panelHeaderHeight,
            controls = {
                play: {
                    type: 'checkbox',
                    input: document.getElementById('play-check')
                },
                bpm: {
                    type: 'number',
                    input: document.getElementById('bpm-number')
                },
                remote: {
                    type: 'checkbox',
                    input: document.getElementById('learn-check')
                },
                prefs: {
                    type: 'checkbox',
                    input: document.getElementById('prefs-check')
                },
                edit: {
                    type: 'checkbox',
                    input: document.getElementById('edit-check')
                },
                help: {
                    type: 'checkbox',
                    input: document.getElementById('help-check')
                }
            },
            
            init = function() {
                controls.play.input.addEventListener('change', function(e) {
                    app.updateApp('play');
                });
                controls.bpm.input.addEventListener('change', function(e) {
                    app.updateApp('bpm', e.target.value);
                });
                controls.remote.input.addEventListener('change', function(e) {
                    app.updateApp('remote', e.target.checked);
                    app.togglePanel('remote', e.target.checked);
                });
                controls.prefs.input.addEventListener('change', function(e) {
                    app.togglePanel('preferences', e.target.checked);
                });
                controls.edit.input.addEventListener('change', function(e) {
                    app.togglePanel('settings', e.target.checked);
                });
                controls.help.input.addEventListener('change', function(e) {
                    app.togglePanel('help', e.target.checked);
                });
                
                document.addEventListener('keyup', function(e) {
                    switch (e.keyCode) {
                        case 32:
                            app.updateApp('play');
                            break;
                    }
                });
                
                // get panel header height from CSS.
                var style = getComputedStyle(document.body);
                panelHeaderHeight = parseInt(style.getPropertyValue('--header-height'), 10);
                
                my.addWindowResizeCallback(renderLayout);
                renderLayout();
            },
            
            /**
             * Create settings controls view for a processor.
             * @param  {Object} processor MIDI processor to control with the settings.
             */
            createSettingsView = function(processor) {
                var settingsView = ns.createSettingsView({
                    midiNetwork: midiNetwork,
                    processor: processor,
                    parentEl: editContentEl
                });
                settingsViews.push(settingsView);
            },
            
            /**
             * Delete settings controls view for a processor.
             * @param  {Object} processor MIDI processor to control with the settings.
             */
            deleteSettingsView = function(processor) {
                var n = settingsViews.length;
                while (--n >= 0) {
                    if (settingsViews[n].hasProcessor(processor)) {
                        settingsViews[n].terminate();
                        settingsViews.splice(n, 1);
                        return false;
                    }
                }
            },
            
            renderLayout = function(leftColumn = true, rightColumn = true) {
                if (leftColumn) {
                    renderLayoutLeftColumn();
                    // renderColumnLayout(prefsEl, remoteEl);
                }
                if (rightColumn) {
                    renderLayoutRightColumn();
                }
            },
            
            // renderColumnLayout = function(topEl, bottomEl) {
            //     const totalHeight = panelsEl.clientHeight,
            //         isTopVisible = topEl.dataset.show == 'true',
            //         isBtmVisible = btmEl.dataset.show == 'true',
            //         topViewportEl = topEl.querySelector('.panel__viewport'),
            //         btmViewportEl = btmEl.querySelector('.panel__viewport'),
            //         topHeight = topEl.clientHeight,
            //         btmHeight = btmEl.clientHeight,
            //         topContentHeight = topEl.querySelector('.panel__content').clientHeight,
            //         btmContentHeight = btmEl.querySelector('.panel__content').clientHeight;
            //     
            //     if (isTopVisible && isBtmVisible) {
            //         let combinedHeight = topContentHeight + btmContentHeight + (panelHeaderHeight * 2);
            //         if (combinedHeight > totalHeight) {
            //             if (topContentHeight + panelHeaderHeight < totalHeight / 2) {
            //                 topViewportEl.style.height = prefsEl.topContentHeight + 'px';
            //                 btmViewportEl.style.height = (totalHeight - topContentHeight - (panelHeaderHeight * 2)) + 'px';
            //             } else if (btmContentHeight + panelHeaderHeight < totalHeight / 2) {
            //                 topViewportEl.style.height = (totalHeight - btmContentHeight - (panelHeaderHeight * 2)) + 'px';
            //                 btmViewportEl.style.height = remoteEl.topContentHeight + 'px';
            //             } else {
            //                 topViewportEl.style.height = ((totalHeight / 2) - panelHeaderHeight) + 'px';
            //                 btmViewportEl.style.height = ((totalHeight / 2) - panelHeaderHeight) + 'px';
            //             }
            //         } else {
            //             topViewportEl.style.height = 'auto';
            //             btmViewportEl.style.height = 'auto';
            //         }
            //     } else if (isTopVisible) {
            //         if (topContentHeight + panelHeaderHeight > totalHeight) {
            //             topViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
            //         } else {
            //             topViewportEl.style.height = 'auto';
            //         }
            //     } else if (isBtmVisible) {
            //         if (btmContentHeight + panelHeaderHeight > totalHeight) {
            //             btmViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
            //         } else {
            //             btmViewportEl.style.height = 'auto';
            //         }
            //     }
            // },
            
            renderLayoutLeftColumn = function() {
                const totalHeight = panelsEl.clientHeight,
                    isPrefsVisible = prefsEl.dataset.show == 'true',
                    isRemoteVisible = remoteEl.dataset.show == 'true',
                    prefsViewportEl = prefsEl.querySelector('.panel__viewport'),
                    remoteViewportEl = remoteEl.querySelector('.panel__viewport'),
                    prefsHeight = prefsEl.clientHeight,
                    remoteHeight = remoteEl.clientHeight,
                    prefsContentHeight = prefsEl.querySelector('.panel__content').clientHeight,
                    remoteContentHeight = remoteEl.querySelector('.panel__content').clientHeight;
                
                if (isPrefsVisible && isRemoteVisible) {
                    let combinedHeight = prefsContentHeight + remoteContentHeight + (panelHeaderHeight * 2);
                    if (combinedHeight > totalHeight) {
                        if (prefsContentHeight + panelHeaderHeight < totalHeight / 2) {
                            prefsViewportEl.style.height = prefsContentHeight + 'px';
                            remoteViewportEl.style.height = (totalHeight - prefsContentHeight - (panelHeaderHeight * 2)) + 'px';
                        } else if (remoteContentHeight + panelHeaderHeight < totalHeight / 2) {
                            prefsViewportEl.style.height = (totalHeight - remoteContentHeight - (panelHeaderHeight * 2)) + 'px';
                            remoteViewportEl.style.height = remoteContentHeight + 'px';
                        } else {
                            prefsViewportEl.style.height = ((totalHeight / 2) - panelHeaderHeight) + 'px';
                            remoteViewportEl.style.height = ((totalHeight / 2) - panelHeaderHeight) + 'px';
                        }
                    } else {
                        prefsViewportEl.style.height = 'auto';
                        remoteViewportEl.style.height = 'auto';
                    }
                } else if (isPrefsVisible) {
                    if (prefsContentHeight + panelHeaderHeight > totalHeight) {
                        prefsViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
                    } else {
                        prefsViewportEl.style.height = 'auto';
                    }
                } else if (isRemoteVisible) {
                    if (remoteContentHeight + panelHeaderHeight > totalHeight) {
                        remoteViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
                    } else {
                        remoteViewportEl.style.height = 'auto';
                    }
                }
            },
            
            renderLayoutRightColumn = function() {
                const totalHeight = panelsEl.clientHeight,
                    columnWidth = document.querySelector('.panels__right').clientWidth,
                    editWidth = editEl.clientWidth,
                    helpWidth = helpEl.clientWidth,
                    isEditVisible = editEl.dataset.show == 'true',
                    isHelpVisible = helpEl.dataset.show == 'true',
                    editViewportEl = editEl.querySelector('.panel__viewport'),
                    helpViewportEl = helpEl.querySelector('.panel__viewport'),
                    editContentHeight = editEl.querySelector('.panel__content').clientHeight,
                    helpContentHeight = helpEl.querySelector('.help__nav').clientHeight + helpEl.querySelector('.help__copy').clientHeight;
                
                if (editWidth + helpWidth < columnWidth) {
                    if (editContentHeight + panelHeaderHeight > totalHeight) {
                        editViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
                    } else {
                        editViewportEl.style.height = 'auto';
                    }
                    if (helpContentHeight + panelHeaderHeight > totalHeight) {
                        helpViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
                    } else {
                        helpViewportEl.style.height = 'auto';
                    }
                } else {
                    if (isEditVisible && isHelpVisible) {
                        let combinedHeight = editContentHeight + helpContentHeight + (panelHeaderHeight * 2);
                        if (combinedHeight > totalHeight) {
                            if (editContentHeight + panelHeaderHeight < totalHeight / 2) {
                                editViewportEl.style.height = editContentHeight + 'px';
                                helpViewportEl.style.height = (totalHeight - editContentHeight - (panelHeaderHeight * 2)) + 'px';
                            } else if (helpContentHeight + panelHeaderHeight < totalHeight / 2) {
                                editViewportEl.style.height = (totalHeight - helpContentHeight - (panelHeaderHeight * 2)) + 'px';
                                helpViewportEl.style.height = helpContentHeight + 'px';
                            } else {
                                editViewportEl.style.height = ((totalHeight / 2) - panelHeaderHeight) + 'px';
                                helpViewportEl.style.height = ((totalHeight / 2) - panelHeaderHeight) + 'px';
                            }
                        } else {
                            editViewportEl.style.height = 'auto';
                            helpViewportEl.style.height = 'auto';
                        }
                    } else if (isEditVisible) {
                        if (editContentHeight + panelHeaderHeight >= totalHeight) {
                            editViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
                        } else {
                            editViewportEl.style.height = 'auto';
                        }
                    } else if (isHelpVisible) {
                        if (helpContentHeight + panelHeaderHeight >= totalHeight) {
                            helpViewportEl.style.height = totalHeight - panelHeaderHeight + 'px';
                        } else {
                            helpViewportEl.style.height = 'auto';
                        }
                    }
                }
            },
            
            updateControl = function(property, value) {
                switch(property) {
                    case 'bpm':
                        controls.bpm.input.value = value;
                        break;
                    case 'play':
                        controls.play.input.checked = value;
                        break;
                    case 'remote':
                        controls.remote.input.checked = value;
                        break;
                }
            },
            
            showPanel = function(panelID, isVisible) {
                switch (panelID) {
                    case 'help':
                        helpEl.dataset.show = isVisible;
                        break;
                    case 'preferences':
                        prefsEl.dataset.show = isVisible;
                        break;
                    case 'remote':
                        remoteEl.dataset.show = isVisible;
                        break;
                    case 'settings':
                        editEl.dataset.show = isVisible;
                        break;
                    default:
                        console.error('Panel ID ', panelID, 'not found.');
                        return;
                }
                
                renderLayout();
            };
        
        my = my || {};
        
        that = ns.addWindowResize(specs, my);
        
        init();
        
        that.renderLayout = renderLayout;
        that.createSettingsView = createSettingsView;
        that.deleteSettingsView = deleteSettingsView;
        that.updateControl = updateControl;
        that.showPanel = showPanel;
        return that;
    };

    ns.createAppView = createAppView;

})(WH);
