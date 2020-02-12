//!plus
    plus_audioIsInit = false;

    plus_jumps = [Math.pow(2,-6/12), 1, Math.pow(2,-6/12), Math.pow(2,3/12)];
    plus_jumpIndex = 0;

    plus_jumpSound = {rate(){}, play(){}};
    plus_winSound  = {rate(){}, play(){}};
    plus_hitSound  = {rate(){}, play(){}};

    plus_initAudio = () => {
        if (plus_audioIsInit) return;
        plus_audioIsInit = true;

        new Howl({
            src: ['music.mp3'],
            autoplay: true,
            volume: .2,
            loop: true,
        }).play();

        plus_jumpSound = new Howl({ src: ['jump.wav'], volume: .4 });
        plus_winSound  = new Howl({ src: ['win.wav'],  volume: .3 });
        plus_hitSound  = new Howl({ src: ['thud.wav'], });
    };

    plus_soundPixel = Uint8Array.from([0,0,0,0]);

    plus_didMeasureFPS = false;
    plus_lastFrameTime = 0;
    plus_frameTimeBuffer = [];
//!end

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

$scoreFormat = ($a, $b) => 'Track#' + $b + ':#' + ($a/60|0) + '.' + ($a=$a/.6%100|0, $a>9?$a:'0'+$a),

$frames = 
$track = 0,

$init = $a => (
    $stateBuffer = Uint8Array.from($stateBufferArray = [0,0,0,0,128,1,128,1,255,1,192,1,0,100,0,0]),

    $track = Math.min(10, Math.max(1, $a ? $track : (
        $best = localStorage.getItem($track) || 5940,
        $frames < $best && localStorage.setItem($track, $best = $frames),
        prompt(
            Array(10).fill().map(($a,$b) =>
                $scoreFormat(localStorage.getItem($b+1) || 5940, $b+1)
                + ($b%2 ? '\n' : '#####')
            ).join(''),
            $track + 1
        ) | 0
    ))),

    $keys =
    $win =
    $ballPos = 
    $frames = 
    $cameraOffset = 
    $camFromBall = 0
),

$init(),

//!plus
document.onkeydown = $a => ($keys[$a.keyCode] = !$a.repeat, $a.preventDefault(), plus_initAudio()),
//!end
//!2k
document.onkeydown = $a => $keys[$a.keyCode] = !$a.repeat,
//!end

$main = $a => (
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
        //!plus
        , $win && plus_winSound.play()
        //!end
    ),
    $win > 180 && $init(),

    $stateBufferArray[3] = $cameraOffset,
    $keys[82] && $init(1), // R key to reset
    $keys = {},

    s.innerText = $scoreFormat($frames, $track),

    //!plus
        g.readPixels(4, 0, 1, 1, g.RGBA, 5121, plus_soundPixel),

        plus_soundPixel[0] > 100 && (
            plus_jumpSound.rate(plus_jumps[plus_jumpIndex]),
            plus_jumpSound.play(),
            plus_jumpIndex = (plus_jumpIndex + 1) % plus_jumps.length
        ),

        plus_soundPixel[1] > 100 && (
            plus_hitSound.rate(.8 + .4*Math.random()),
            plus_hitSound.play()
        ),

        !plus_didMeasureFPS && $frames > 30 && (
            plus_nuFrameTime = performance.now(),
            plus_lastFrameTime !== 0 && plus_frameTimeBuffer.push(plus_nuFrameTime - plus_lastFrameTime),
            plus_lastFrameTime = plus_nuFrameTime,

            plus_frameTimeBuffer.length > 30 && (
                plus_FPS = plus_frameTimeBuffer.reduce((a, x) => a + x) / plus_frameTimeBuffer.length,
                console.log('FPS: ' + 1000/plus_FPS),
                plus_didMeasureFPS = true
            )
        ),
    //!end

    requestAnimationFrame($main)
),
$main()