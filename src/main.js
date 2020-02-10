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

g.vertexAttribPointer(
    g.linkProgram($shader),
    2,
    g.BYTE,
    g.enableVertexAttribArray(g.useProgram($shader)),
    g.bindBuffer($a = g.ARRAY_BUFFER, g.createBuffer()),
    g.bufferData($a, Uint8Array.of(1, 1, 1, 128, 128, 1), $a + 82) // ARRAY_BUFFER + 82 = STATIC_DRAW; 128 = -127
),

$timeFormat = $a => ($a |= 0, $a > 9 ? $a : `0`+$a),
$scoreFormat = ($a, $b, g) => g ? ``
    : $b+`#-#${$timeFormat($a/3600)}:${$timeFormat($a/60%60)}:${$timeFormat($a/.6%100)}`,

$frames = 
$track = 0,

$init = $a => (
    $stateBuffer = Uint8Array.from($stateBufferArray = [0,0,0,0,128,1,128,1,255,1,192,1,0,100,0,0]),

    $track = Math.min(10, Math.max(1, $a ? $track : (
        $best = localStorage.getItem($track) || 1e9,
        $frames < $best && localStorage.setItem($track, $best = $frames),
        prompt($scoreFormat($best, `Best`, !$track) + `\nTrack?#(1-10)`, $track + 1) | 0
    ))),

    $keys =
    $win =
    $ballPos = 
    $frames = 
    $cameraOffset = 
    $camFromBall = 0
),

$init(),

document.onkeydown = $a => $keys[$a.keyCode] = !$a.repeat,

$main = $a => (
    g.readPixels(
        g.drawArrays(
            g.TRIANGLES,
            g.uniformMatrix4fv(
                g.getUniformLocation($shader, `g`),
                g.viewport(0, 0, (a.width = innerWidth)/devicePixelRatio, (a.height = innerHeight)/devicePixelRatio), // Returns 0
                $stateBufferArray
            ), // Returns 0
            3
        ), // Returns 0
        0, 4, 1, g.RGBA, 5121, $stateBuffer // UNSIGNED_BYTE = 5121
    ), 

    $stateBufferArray = Array.from($stateBuffer),
    $stateBufferArray[0] = 1e5*a.width + a.height,
    $stateBufferArray[2] = !$win && $keys[38]|0 + 2*$keys[40]|0, // 38 = up arrow, 40 = down arrow
    $stateBufferArray[14] = $track,
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

    s.innerText = $scoreFormat($frames, `Track#` + $track),

    requestAnimationFrame($main)
),
$main()