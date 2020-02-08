$shader = g.createProgram(),

$a = __shader('shader.vert'),
$b = g.createShader(g.VERTEX_SHADER),
g.shaderSource($b, $a),
g.compileShader($b),
g.attachShader($shader, $b),
//console.log(g.getShaderInfoLog($b)),

$a = __shader('shader.frag'),
$b = g.createShader(g.FRAGMENT_SHADER),
g.shaderSource($b, $a),
g.compileShader($b),
g.attachShader($shader, $b),
//console.log(g.getShaderInfoLog($b)),

g.linkProgram($shader),

g.vertexAttribPointer(
    g.linkProgram($shader),
    2,
    g.BYTE,
    g.enableVertexAttribArray(g.useProgram($shader)),
    g.bindBuffer($a = g.ARRAY_BUFFER, g.createBuffer()),
    g.bufferData($a, Uint8Array.of(28, 28, 28, 128, 128, 28), $a + 82) // ARRAY_BUFFER + 82 = STATIC_DRAW; 128 = -127
),

//
//   JS/GLSL shared state buffer
//
//  0 : g[0].x : W  : 100000 * canvas width + canvas height
//  1 : g[0].y : unused
//  2 : g[0].z : W  : key input flags & seed
//  3 : g[0].w : W  : camera offset x
//  4 : g[1].x : RW : upper pos.x (relative to camera)
//  5 : g[1].y : RW : lower pos.x (relative to camera)
//  6 : g[1].z : RW : upper pos.y (relative to camera)
//  7 : g[1].w : RW : lower pos.y (relative to camera)
//  8 : g[2].x : RW : upper vel.x
//  9 : g[2].y : RW : lower vel.x
// 10 : g[2].z : RW : upper vel.y
// 11 : g[2].w : RW : lower vel.y
// 12 : g[3].x : W  : previous camera offset x, R : reset
// 13 : g[3].y : unused
// 14 : g[3].z : RW : jump state flags
// 15 : g[3].w : RW : jump grace counter
//

$seed = 0,

$init = $a => (
    $stateBufferArray = [128,1,128,1,128,1,128,1,255,1,192,1,128,1,128,0],
    $stateBuffer = new Uint8Array(16),
    $ballPos = 
    $frames = 
    $cameraOffset = 
    $camFromBall = 0,
    $seed = $a?$seed:prompt(s.innerText+'\nTrack?',$seed+1)|0,
    $initCameraOffset = 1,
    $keys = {}
),

$init(),

document.onkeydown = $a => $keys[$a.keyCode] = 1,
document.onkeyup   = $a => $keys[$a.keyCode] = 0,

$timeFormat = $a => ($a |= 0, $a > 9 ? $a : '0'+$a),

setInterval($a => (
    g.readPixels(
        g.drawArrays(
            g.TRIANGLES,
            g.uniformMatrix4fv(
                g.getUniformLocation($shader, 'g'),
                g.viewport(0, 0, a.width, a.height), // Returns 0
                $stateBufferArray
            ), // Returns 0
            3
        ), // Returns 0
        0, 4, 1, g.RGBA, 5121, $stateBuffer // UNSIGNED_BYTE = 5121
    ), 
    $stateBufferArray = Array.from($stateBuffer),
    $stateBufferArray[0] = 1e5*(a.width = innerWidth) + (a.height = innerHeight),
    $stateBufferArray[2] = $keys[39]|0 + 2*$keys[40]|0 + 4*$seed, // 39 = Right arrow, 40 = Down arrow
    $stateBufferArray[12] = $cameraOffset,

    $ballVelX = ($stateBufferArray[8]/255 + $stateBufferArray[9]/255/255) * 2 - 1,
    $ballPos += $ballVelX * .05 / 3.5 + $initCameraOffset,
    $initCameraOffset = 0,

    $camFromBall += ($ballVelX / 3 - $camFromBall) / 99,
    $cameraOffset = $camFromBall + $ballPos,
    $stateBufferArray[3] = $cameraOffset,

    $keys[82]     && $init(1), // R key to reset
    $ballPos > 20 && $init(),  // Win condition

    s.innerText = `Track#${$seed}#>#${$timeFormat(++$frames/3600)}:${$timeFormat($frames/60%60)}:${$timeFormat($frames/.6%100)}`
), 16)