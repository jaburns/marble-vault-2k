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
    g.bufferData($a, Uint8Array.of(2, 2, 2, 252, 252, 2), $a + 82) // ARRAY_BUFFER + 82 = STATIC_DRAW; 252 = -4
),

$stateBufferArray = [4,4,0,0,127,0,0,0,0,0,0,0,0,0,0,0],
$stateBuffer = new Uint8Array(16),

$keys = {37:0, 39:0}, // 37 = Left arrow, 39 = Right arrow
document.onkeydown = $a => $keys[$a.keyCode] = 1;
document.onkeyup   = $a => $keys[$a.keyCode] = 0;

setInterval($b => (
    g.readPixels(
        g.drawArrays(
            g.TRIANGLES,
            g.uniformMatrix4fv(
                g.getUniformLocation($shader, 'g'),
                g.viewport(0, 0, $stateBufferArray[0], $stateBufferArray[1]), // Returns 0
                $stateBufferArray
            ), // Returns 0
            3
        ), // Returns 0
        0, 4, 1, g.RGBA, 5121, $stateBuffer // UNSIGNED_BYTE = 5121
    ), 
    $stateBufferArray = Array.from($stateBuffer),
    $stateBufferArray[0] = a.width = innerWidth,
    $stateBufferArray[1] = a.height = innerHeight,
    $stateBufferArray[2] = $keys[37] + 2*$keys[39],
    s.innerText = ($stateBufferArray[4]/255 + $stateBufferArray[5]/255/255) * 2 - 1
//  ,console.log($stateBufferArray)
), 16)