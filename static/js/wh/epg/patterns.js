/**
 * @description Patterns modele.
 * @author Wouter Hisschemöller
 * @version 0.0.0
 * 
 * @namespace WH.epg
 */
 
 window.WH = window.WH || {};
 window.WH.epg = window.WH.epg || {};

(function (ns) {
    
    function createPatternData(specs) {
        specs = specs || {};
        
        var that = {
            steps: specs.steps || 16,
            pulses: specs.pulses || 4,
            rotation: specs.rotation || 0,
            
            euclidPattern: [],
            
            channel: specs.channel || 0,
            
            // position and duration in ticks
            position: specs.position || 0,
            duration: specs.duration || 0,
            
            isOn: false,
            isSelected: false,
            
            offPosition: 0,
            lastPosition: 0,
            
            canvasX: specs.canvasX || 0,
            canvasY: specs.canvasY || 0,
            canvasWidth: 0,
            canvasHeight: 0
        };
        
        return that;
    }
    
    function createPatterns(specs) {
        var that,
            arrangement = specs.arrangement,
            patternCanvas = specs.patternCanvas,
            patternSettings = specs.patternSettings,
            patterns = [],
            numPatterns = patterns.length,
            selectedPattern,
            
            /**
             * Create a Euclidean step sequence from a pattern's steps and fills data.
             * @param {Array} euclidPattern Array of 0 and 1 values indicating pulses or silent steps.
             * @return {Array} Data objects to create arrangement steps with.
             */
            createArrangementSteps = function(euclidPattern) {
                var i,
                    numSteps = euclidPattern.length,
                    steps = [],
                    stepDuration = Math.floor( WH.conf.getPPQN() / WH.conf.getStepsPerBeat() );
                for (i = 0; i < numSteps; i++) {
                    steps.push({
                        pitch: 60,
                        velocity: !!euclidPattern[i] ? 100 : 0,
                        start: stepDuration * i,
                        duration: stepDuration
                    });
                }
                return steps;
            },
            
            /**
             * Create Euclidean rhythm pattern.
             * Code from withakay/bjorklund.js
             * @see https://gist.github.com/withakay/1286731
             */
            createBjorklund = function(steps, pulses) {
                var pattern = [],
                    counts = [],
                	remainders = [],
                	divisor = steps - pulses,
                	level = 0;
                
            	steps = Math.round(steps);
            	pulses = Math.round(pulses);
                remainders.push(pulses);

            	if (pulses > steps || pulses == 0 || steps == 0) {
            		return new Array();
            	}
                
            	while(true) {
            		counts.push(Math.floor(divisor / remainders[level]));
            		remainders.push(divisor % remainders[level]);
            		divisor = remainders[level]; 
            	    level += 1;
            		if (remainders[level] <= 1) {
            			break;
            		}
            	}
            	
            	counts.push(divisor);

            	var r = 0;
            	var build = function(level) {
            		r++;
            		if (level > -1) {
            			for (var i=0; i < counts[level]; i++) {
            				build(level-1); 
            			}	
            			if (remainders[level] != 0) {
            	        	build(level-2);
            			}
            		} else if (level == -1) {
            	           pattern.push(0);	
            		} else if (level == -2) {
                       pattern.push(1);        
            		} 
            	};

            	build(level);
            	return pattern.reverse();
            }, 
            
            /**
             * Create a pattern and add it to the list.
             */
            createPattern = function(specs) {
                specs = specs || {};
                var patternData = createPatternData({
                        steps: specs.steps,
                        pulses: specs.pulses,
                        rotation: specs.rotation,
                        channel: patterns.length,
                        canvasX: specs.canvasX,
                        canvasY: specs.canvasY
                    }),
                    euclidPattern,
                    arrangementSteps,
                    trackIndex = arrangement.createTrack();
                
                patterns.push(patternData);
                numPatterns = patterns.length;
                
                updatePattern(patternData, trackIndex);
                
                // selectPattern will also redraw the canvas
                selectPattern(patternData);
            },
            
            /**
             * Update the pattern if one of the Euclidean settings have changed.
             * @param {Object} ptrn Pattern data object.
             */
            updatePattern = function(ptrn) {    
                var ptrnIndex = patterns.indexOf(ptrn),
                    euclidPattern = createBjorklund(ptrn.steps, ptrn.pulses),
                    elementsToShift = euclidPattern.splice(euclidPattern.length - ptrn.rotation),
                    arrangementSteps;
                    
                euclidPattern = elementsToShift.concat(euclidPattern);
                console.log(euclidPattern);
                
                ptrn.euclidPattern = euclidPattern;
                ptrn.duration = (ptrn.steps / WH.conf.getStepsPerBeat()) * WH.conf.getPPQN();
                
                // create arrangement steps from euclidean pattern
                arrangementSteps = createArrangementSteps(euclidPattern)
                arrangement.updateTrack(ptrnIndex, arrangementSteps);
            },
            
            selectPattern = function(ptrn) {
                var i,
                    index = patterns.indexOf(ptrn);
                
                for (i = 0; i < numPatterns; i++) {
                    patterns[i].isSelected = (i === index);
                }
                
                selectedPattern = ptrn;
                
                // update view
                patternCanvas.drawB(patterns);
                patternSettings.setPattern(selectedPattern);
            },
            
            deleteSelectedPattern = function() {
                if (!selectedPattern) {
                    return;
                }
                
                var index = patterns.indexOf(selectedPattern);
                
                // remove track from arrangement
                arrangement.deleteTrack(index);
                
                // find and delete patternData
                patterns.splice(index, 1);
                numPatterns = patterns.length;
                
                // selectPattern will also redraw the canvas
                selectPattern(null);
            },
            
            /**
             * Get pattern occupying a given coordinate on the canvas.
             * @return {Object} Pattern data object.
             */
            getPatternByCoordinate = function(x, y) {
                var i, ptrn;
                for (i = 0; i < numPatterns; i++) {
                    ptrn = patterns[i]
                    if (x >= ptrn.canvasX && x <= ptrn.canvasX + ptrn.canvasWidth &&
                        y >= ptrn.canvasY && y <= ptrn.canvasY + ptrn.canvasHeight) {
                        return ptrn;
                    }
                }
            },
            
            /**
             * Update the value of a single property of the selected pattern.
             * @param {String} name Property name.
             * @param {Number} value Property value.
             */
            setPatternProperty = function(name, value) {
                switch (name) {
                    case 'steps':
                        value = Math.min(value, 64);
                        selectedPattern.steps = value;
                        if (selectedPattern.pulses > value) {
                            selectedPattern.pulses = value;
                            patternSettings.updateSetting('pulses', value);
                        }
                        if (selectedPattern.rotation > value) {
                            selectedPattern.rotation = value;
                            patternSettings.updateSetting('rotation', value);
                        }
                        updatePattern(selectedPattern);
                        patternSettings.updateSetting(name, value);
                        patternCanvas.drawB(patterns);
                        break;
                    case 'pulses':
                    case 'rotation':
                        value = Math.min(value, selectedPattern.steps);
                        selectedPattern[name] = value;
                        updatePattern(selectedPattern);
                        patternSettings.updateSetting(name, value);
                        patternCanvas.drawB(patterns);
                        break;
                }
            },
            
            /**
             * Update pattern data and view while transport runs.
             * @param {Number} transportPosition Playhead position in ticks.
             */
            onTransportRun = function(transportPosition) {
                var i,
                    pattern;
                for (i = 0; i < numPatterns; i++) {
                    ptrn = patterns[i];
                    ptrn.position = transportPosition % ptrn.duration;
                    
                    if (ptrn.isOn && ptrn.lastPosition <= ptrn.offPosition && ptrn.position >= ptrn.offPosition) {
                        ptrn.isOn = false;
                    }
                    
                    ptrn.lastPosition = ptrn.position;
                }
                patternCanvas.drawA(patterns);
            },
            
            onTransportScan = function(playbackQueue) {
                var i,
                    numSteps = playbackQueue.length;
                for (i = 0; i < numSteps; i++) {
                    var step = playbackQueue[i],
                        ptrn = patterns[step.getTrackIndex()];
                    
                    if (step.getVelocity()) {
                        ptrn.isOn = true;
                        ptrn.offPosition = (ptrn.position + step.getDuration()) % ptrn.duration;
                    }
                }
            },
            
            /**
             * Redraw both canvasses.
             */
            refreshCanvas = function() {
                patternCanvas.drawA(patterns);
                patternCanvas.drawB(patterns);
            };
        
        that = specs.that;
        
        that.createPattern = createPattern;
        that.selectPattern = selectPattern;
        that.getPatternByCoordinate = getPatternByCoordinate;
        that.deleteSelectedPattern = deleteSelectedPattern;
        that.setPatternProperty = setPatternProperty;
        that.onTransportRun = onTransportRun;
        that.onTransportScan = onTransportScan;
        that.refreshCanvas = refreshCanvas;
        return that;
    }

    ns.createPatterns = createPatterns;

})(WH.epg);
