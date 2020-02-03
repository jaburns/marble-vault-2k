uniform highp mat4 g;

highp vec2 writeFloat(highp float a)
{
    a = (a + 1.) / 2.;
    return vec2(
        floor(a*255.) / 255.,
        fract(255. * a)
    );
}

highp float readFloat(highp vec2 a)
{
    return (a.x/255. + a.y/255./255.) * 2. - 1.;
}

// ==============================================================

highp float rand(highp vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

highp float merge(highp float shape1, highp float shape2){
    //return min(shape1, shape2);
    highp vec2 intersectionSpace = vec2(shape1, shape2);
    intersectionSpace = min(intersectionSpace, 0.);
    highp float xx =  length(intersectionSpace);
    highp float simpleUnion = min(shape1, shape2);
    highp float outsideDistance = max(simpleUnion, 0.);
    return -xx + outsideDistance;
}

highp float map(highp vec2 p, highp float seed)
{
    highp vec2 v = p;
    v.x = mod(v.x+.5, 1.)-.5;
    
    highp float ra = rand(vec2(seed+1.,floor(p.x+ .5)));
    highp float rb = rand(vec2(seed+1.,floor(p.x+1.5)));
    highp float rc = rand(vec2(seed+1.,floor(p.x- .5)));
    
    highp float oa = rand(vec2(seed+2.,floor(p.x+ .5)));
    highp float ob = rand(vec2(seed+2.,floor(p.x+1.5)));
    highp float oc = rand(vec2(seed+2.,floor(p.x- .5)));    
    
    if (p.y + oa > 0.) return -1.;
    
    highp float a = length(v+vec2( 0,oa)) - (.7 + .5*ra);
    highp float b = length(v+vec2(-1,ob)) - (.7 + .5*rb);
    highp float c = length(v+vec2( 1,oc)) - (.7 + .5*rc);
    
    return merge(merge(a,c),b);
}

highp vec3 drawmap(highp vec2 pos, highp float seed)
{
    highp float y = map(pos, seed);
    return y < -.045 ? vec3(0) : y < 0. ? vec3(.2,0,0) : vec3(0,pow(y+1.,4.)-.7,0);
}

highp vec3 worldColor(highp vec2 uv, highp float t, highp float seed)
{
    uv.y -= .7;
    uv.x += t / 60.;
    return drawmap(uv, seed);
}

// ==============================================================

void main()
{
    highp vec2 coord = gl_FragCoord.xy;
    highp vec2 pos = vec2(readFloat(g[1].xy), readFloat(g[1].zw));
    highp vec2 vel = vec2(readFloat(g[2].xy), readFloat(g[2].zw));

    bool left  = mod(g[0].z,      2.) > .9;
    bool right = mod(g[0].z / 2., 2.) > .9;
    bool up    = mod(g[0].z / 4., 2.) > .9;
    bool down  = mod(g[0].z / 8., 2.) > .9;
    highp float seed = floor(g[0].z / 16.);

// Rendering

    highp vec2 m = (coord - g[0].xy * .5) / g[0].y;
    m *= 3.;

    if (length(m-pos) < .05) {
        m -= pos;
        highp vec3 col = vec3(.714,.376,.706);
        highp float x = max((6.*length(m-vec2(.04))) + .9,0.);
        col *= 1./x/x;
        gl_FragColor = vec4(col,1);
    } else {
        gl_FragColor = vec4(worldColor(m, g[0].w, seed), 1);
    }

// State update

    if (coord.y < 1. && coord.x < 4.)
    {
        if (left)  vel.x -= 0.1;
        if (right) vel.x += 0.1;
        if (up)    vel.y += 0.1;
        if (down)  vel.y -= 0.1;

        pos += 0.01 * vel;
        vel *= 0.95;

        gl_FragColor = vec4(writeFloat(seed/999.), 0, 0);

        if (coord.x < 2.) {
            gl_FragColor = vec4(writeFloat(pos.x), writeFloat(pos.y)); // g[1]
        }
        else if (coord.x < 3.) {
            gl_FragColor = vec4(writeFloat(vel.x), writeFloat(vel.y)); // g[2]
        }
    }
}