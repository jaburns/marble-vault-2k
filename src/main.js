$shader = g.createProgram(),

$a = __shader('shader.vert'),
$b = g.createShader(g.VERTEX_SHADER),
g.shaderSource($b, $a),
g.compileShader($b),
g.attachShader($shader, $b),

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
//  1 : g[0].y : W  : previous camera offset x
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
// 12 : g[3].x : RW : ball angle
// 13 : g[3].y : RW : ball angular velocity
// 14 : g[3].z :      unused
// 15 : g[3].w : RW : jump grace counter
//

$timeFormat = $a => ($a |= 0, $a > 9 ? $a : '0'+$a),
$scoreFormat = ($a,$b) => $b<1?'':`Track#${$b}#-#${$timeFormat($a/3600)}:${$timeFormat($a/60%60)}:${$timeFormat($a/.6%100)}`,

$frames = 
$seed = 0,

$init = $a => (
    $stateBuffer = Uint8Array.from($stateBufferArray = [0,0,0,0,128,1,128,1,255,1,192,1,0,100,0,0]),
    $seed = $a ? $seed : (
        $best = localStorage.getItem($seed) || 1e6,
        $frames < $best && localStorage.setItem($seed, $best = $frames),
        prompt(`${$scoreFormat($best, $seed)}\nTrack?#(1-10)`,$seed+1)|0
    ),
    $seed = Math.min(10,Math.max(1,$seed)),
    $keys =
    $win =
    $ballPos = 
    $frames = 
    $cameraOffset = 
    $camFromBall = 0
),

$init(),

document.onkeydown = $a => $keys[$a.keyCode] = !$a.repeat,

setInterval($a => (
    g.readPixels(
        g.drawArrays(
            g.TRIANGLES,
            g.uniformMatrix4fv(
                g.getUniformLocation($shader, 'g'),
                g.viewport(0, 0, a.width = innerWidth, a.height = innerHeight), // Returns 0
                $stateBufferArray
            ), // Returns 0
            3
        ), // Returns 0
        0, 4, 1, g.RGBA, 5121, $stateBuffer // UNSIGNED_BYTE = 5121
    ), 
    $stateBufferArray = Array.from($stateBuffer),
    $stateBufferArray[0] = 1e5*a.width + a.height,
    $stateBufferArray[2] = !$win && $keys[38]|0 + 2*$keys[40]|0, // 38 = Up arrow, 40 = Down arrow
    $stateBufferArray[14] = $seed,
    $stateBufferArray[1] = $cameraOffset,

    $ballVelX = ($stateBufferArray[8]/255 + $stateBufferArray[9]/255/255) * 2 - 1,
    $ballPos += $ballVelX * .05 / 3.5,
    $camFromBall += ($ballVelX / 3 - $camFromBall) / 99,

    $win && $win++ || (
        $cameraOffset = $camFromBall + $ballPos,
        $frames++,
        $win = $ballPos > 10
    ),
    $win > 180 && $init(),

    $stateBufferArray[3] = $cameraOffset,

    $keys[82] && $init(1), // R key to reset
    $keys = {},

    s.innerText = $scoreFormat($frames, $seed)
), 16)