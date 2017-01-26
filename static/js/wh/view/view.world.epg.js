/**
 * Controller for EPG 3D object.
 * @namespace WH
 */

window.WH = window.WH || {};

(function (ns) {
    
    function createWorldEPGView(specs, my) {
        var that,
            processor = specs.processor,
            object3d = specs.object3d,
            hitarea3d = object3d.getObjectByName('hitarea'),
            centreCircle3d = object3d.getObjectByName('centreCircle'),
            pointer3d = object3d.getObjectByName('pointer'),
            polygon3d = object3d.getObjectByName('polygon'),
            dots3d = object3d.getObjectByName('dots'),
            select3d = object3d.getObjectByName('select'),
            centreDot3d = object3d.getObjectByName('centreDot'),
            zeroMarker3d = object3d.getObjectByName('zeroMarker'),
            rotatedMarker3d = object3d.getObjectByName('rotatedMarker'),
            centreDotEndTween,
            TWO_PI = Math.PI * 2,
            radius3d,
            
            init = function() {
                // add callback to update before render.
                processor.addRenderCallback(showPlaybackPosition);
                processor.addProcessCallback(showNote);
                
                // set position in 3d
                object3d.position.copy(processor.getProperty('position3d'));
                object3d.userData.id = processor.getProperty('id');
                object3d.addEventListener('touchstart', onTouchstart);
                object3d.addEventListener('dragend', onDragEnd);
                
                // add listeners to parameters
                var params = processor.getParameters();
                params.steps.addChangedCallback(updateDots);
                params.pulses.addChangedCallback(updateDots);
                params.rotation.addChangedCallback(updateDots);
                params.is_solo.addChangedCallback(updatePointer);
                params.is_mute.addChangedCallback(updatePointer);
                
                // set the dots around the wheel
                updateDots();
            },
            
            showPlaybackPosition = function(position, duration) {
                pointer3d.rotation.z = TWO_PI * (-position / duration);
            },
            
            showNote = function(stepIndex, noteStartDelay, noteStopDelay) {
                
                // find and animate the necklace dot
                var dot = dots3d.children[stepIndex];
                new TWEEN.Tween({scale: 0.2})
                    .to({scale: 0.10}, 300)
                    .onUpdate(function() {
                            dot.scale.set(this.scale, this.scale, 1);
                        })
                    .delay(noteStartDelay)
                    .start();
                    
                // stop centre dot animation, if any
                if (centreDotEndTween) {
                    centreDotEndTween.stop();
                }
                
                // centre dot start animation
                var startTween = new TWEEN.Tween({scale: 0.01})
                    .to({scale: 0.10}, 10)
                    .onStart(function() {
                            centreDot3d.visible = true;
                        })
                    .onUpdate(function() {
                            centreDot3d.scale.set(this.scale, this.scale, 1);
                        })
                    .delay(noteStartDelay);
                    
                // centre dot end animation
                var stopTween = new TWEEN.Tween({scale: 0.10})
                    .to({scale: 0.01}, 150)
                    .onUpdate(function() {
                            centreDot3d.scale.set(this.scale, this.scale, 1);
                        })
                    .onComplete(function() {
                            centreDot3d.visible = false;
                        })
                    .delay(noteStopDelay - noteStartDelay);
                
                // start centre dot animation
                startTween.chain(stopTween);
                startTween.start();
                
                centreDotEndTween = stopTween;
            },
            
            /**
             * Touch start on Object3D.
             * @param  {Object} e Object3D event.
             */
            onTouchstart = function(e) {
                ns.pubSub.fire('select.processor', processor);
            },
            
            /**
             * Drag end on Object3D.
             * @param  {Object} e Object3D event.
             */
            onDragEnd = function(e) {
                processor.setProperty('position3d', e.target.position.clone());
            },
            
            /**
             * Update the pattern dots.
             * If the steps, pulses or rotation properties have changed.
             * If steps change it might invalidate the ponter.
             */
            updateDots = function() {
                var steps = processor.getParamValue('steps'),
                    rotation = processor.getParamValue('rotation'),
                    euclid = processor.getProperty('euclid');
                
                // remove all existing dots
                var n = dots3d.children.length;
                for (var i = 0; i < n; i++) {
                    dots3d.remove(dots3d.children[0]);
                }
                
                polygonPoints = [];
                
                // add new dots
                var rad, dot;
                radius3d = 8 + (steps > 16 ? (steps - 16) * 0.5 : 0);
                for (i = 0; i < steps; i++) {
                    rad = TWO_PI * (i / steps);
                    if (euclid[i]) {
                        dot = centreDot3d.clone();
                    } else {
                        dot = select3d.clone();
                    }
                    dot.scale.set(0.1, 0.1, 1);
                    dot.translateX(Math.sin(rad) * radius3d);
                    dot.translateY(Math.cos(rad) * radius3d);
                    dot.visible = true;
                    dots3d.add(dot);
                    
                    // add coordinate of filled dot to polygon points
                    if (euclid[i]) {
                        polygonPoints.push(dot.position.clone());
                    }
                }
                
                polygonPoints.push(polygonPoints[0].clone());
                
                updatePolygon(polygonPoints);
                updateHitarea();
                updatePointer();
                updateZeroMarker(steps, rotation);
                updateRotatedMarker(rotation);
            },
            
            /**
             * Update the polygon shape that connects the dots.
             * @param {array} points Coordinates of the shape points.
             */
            updatePolygon = function(points) {
                var i, n, line, lineGeom, fillShape, fillGeom;
                
                var fill = polygon3d.getObjectByName('polygonFill');
                
                if (points.length > 2) {
                    polygon3d.visible = true;
                } else {
                    polygon3d.visible = false;
                    return;
                }
                
                if (points.length > 3) {
                    fillShape = new THREE.Shape();
                    fillShape.moveTo(points[0].x, points[0].y);
                    n = points.length;
                    for (i = 1; i < n; i++) {
                        fillShape.lineTo(points[i].x, points[i].y);
                    }
                    fillShape.lineTo(points[0].x, points[0].y);
                    fillGeom = new THREE.ShapeGeometry(fillShape);
                    fill.geometry = fillGeom;
                    fill.visible = true;
                } else {
                    fill.visible = false;
                }
                
                line = polygon3d.getObjectByName('polygonLine');
                line.geometry.dispose();
                line.geometry = new THREE.Geometry();
                line.geometry.vertices = points;
                line.geometry.verticesNeedUpdate = true;
            },
            
            /**
             * Update the hitarea used for mouse detection.
             */
            updateHitarea = function() {
                var scale = (radius3d + 3) * 0.1;
                hitarea3d.scale.set(scale, scale, 1);
            },
            
            /**
             * Update the pointer that connects the dots.
             */
            updatePointer = function() {
                var isSolo = processor.getParamValue('is_solo'),
                    isMute = processor.getParamValue('is_mute'),
                    isNotSolo = processor.getProperty('is_not_solo'),
                    isNoteInControlled = processor.getProperty('isNoteInControlled'),
                    isMutedByNoteInControl = processor.getProperty('isMutedByNoteInControl'),
                    mutedRadius = 4.5,
                    radius = (isMute || isNotSolo || isMutedByNoteInControl) ? mutedRadius : radius3d;
                pointer3d.geometry.dispose();
                pointer3d.geometry = createPointerGeometry(radius, isSolo, isNoteInControlled);
            },
            
            /**
             * Create geometry for the pointer.
             * Also used by the pointer update function.
             * @param {Number} radius Pointer radius.
             * @param {Boolean} isSolo Pointer shows solo state.
             * @param {Boolean} isNoteInControlled Pointer shows external control state.
             * @return {Object} Three.js Geometry object.
             */
            createPointerGeometry = function(radius, isSolo, isNoteInControlled) {
                var geometry = new THREE.Geometry();
                if (isNoteInControlled) {
                    var halfRadius = centreRadius + ((radius - centreRadius) / 2);
                    geometry.vertices.push(
                        new THREE.Vector3(0.0, centreRadius, 0.0),
                        new THREE.Vector3(-0.9, halfRadius, 0.0),
                    	new THREE.Vector3(0.0, radius, 0.0),
                        new THREE.Vector3(0.9, halfRadius, 0.0),
                        new THREE.Vector3(0.0, centreRadius, 0.0)
                    );
                } else {
                    geometry.vertices.push(
                    	new THREE.Vector3(-2.9, 0.7, 0.0),
                    	new THREE.Vector3(0.0, radius, 0.0),
                    	new THREE.Vector3(2.9, 0.7, 0.0)
                    );
                    
                    if (isSolo) {
                        geometry.vertices.push(
                            new THREE.Vector3(0.0, radius, 0.0),
                            new THREE.Vector3(0.0, 1.0, 0.0)
                        );
                    }
                }
                
                return geometry;
            },
            
            /**
             * Update the zero marker.
             * @param {Number} steps Euclidean necklace node amount.
             * @param {Number} rotation Euclidean necklace rotation.
             */
            updateZeroMarker = function(steps, rotation) {
                var rad = TWO_PI * (-rotation / steps),
                    radius = radius3d + 3;
                zeroMarker3d.position.x = Math.sin(rad) * radius;
                zeroMarker3d.position.y = Math.cos(rad) * radius;
            },
            
            /**
             * Update the marker that indicates if the pattern is rotated.
             * @param {Number} rotation Euclidean necklace rotation.
             */
            updateRotatedMarker = function(rotation) {
                rotatedMarker3d.position.y = radius3d + 3;
                rotatedMarker3d.visible = rotation !== 0;
            };
    
        that = specs.that || {};
        
        init();
        
        return that;
    };

ns.createWorldEPGView = createWorldEPGView;

})(WH);