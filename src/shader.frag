uniform mat4 g;

float seed;

// ==============================================================

vec2 writeFloat(float a)
{
    a = (a + 1.) / 2.;
    return vec2(
        floor(a*255.) / 255.,
        fract(255. * a)
    );
}

float readFloat(vec2 a)
{
    return (a.x/255. + a.y/255./255.) * 2. - 1.;
}

// ==============================================================

const vec3 i_GROUND_A = 1.-vec3(223.0 / 255.0, 61.0 / 255.0, 161.0 / 255.0);
const vec3 i_GROUND_B = vec3(167.0 / 255.0, 79.0 / 255.0, 28.0 / 255.0);
const vec3 i_SKY = vec3(119. / 255., 181. / 255., 254. / 255.);

vec3 stripes(vec2 xy, vec3 base)
{
    xy += .8*sin(.9*xy.yx);
    return base*(1.-.05*abs(floor(mod(8.*(xy.x+2.-xy.y),4.))-2.));
}

vec3 gnd(vec2 xy, float d, vec3 base)
{
    d = clamp(d, 0., 1.);
    float b = 1. - d;
    float r = 1. - sqrt(1. - b*b);
    return stripes(xy + .2*vec2(-r,r), base) * (1.-.5*pow(clamp(d+.5,.5,1.),2.));
}

// ==============================================================

float rand(vec2 co)
{
    return fract(sin(dot(co,vec2(12.9898,78.233))) * 43758.5453);
}

float merge(float a, float b)
{
    return -length(min(vec2(a, b), 0.)) + max(min(a, b), 0.);
}

float map(vec2 p)
{
    float ra = rand(vec2(seed+1.,floor(p.x+ .5)));
    float rb = rand(vec2(seed+1.,floor(p.x+1.5)));
    float rc = rand(vec2(seed+1.,floor(p.x- .5)));
    float oa = rand(vec2(seed+1.,floor(p.x+ .5+9.)));
    float ob = rand(vec2(seed+1.,floor(p.x+1.5+9.)));
    float oc = rand(vec2(seed+1.,floor(p.x- .5+9.)));    
    
    if (p.y + oa > 0.) return -1.;

    vec2 v = p;
    v.x = mod(v.x+.5, 1.)-.5;
    
    float a = length(v+vec2( 0,oa)) - (.7 + .5*ra);
    float b = length(v+vec2(-1,ob)) - (.7 + .5*rb);
    float c = length(v+vec2( 1,oc)) - (.7 + .5*rc);
    
    return min(p.x-.5*p.y-2.5, merge(merge(a,c),b));
}

vec3 worldColor(vec2 uv, float t, vec3 base)
{
    float y = map(uv);
    return y < -.045 ? vec3(0) : y < 0. ? vec3(0) : gnd(uv, 3.*y, base);
}

bool collision(vec2 pos, float t, out vec3 colInfo)
{
    float y = map(pos);

    vec2 e = vec2(0.0001, 0);
    vec2 n = normalize(vec2(
        map(pos - e.xy) - map(pos + e.xy),
        map(pos - e.yx) - map(pos + e.yx)));

    colInfo = vec3(n, y);

    return y >= -.045;
}

// ==============================================================

vec2 reflect2(vec2 i, vec2 n, float mt, float mn)
{
    //return reflect(i, n);
    vec2 t = vec2(n.y, -n.x);
    float normComp = dot(i, n);
    float tanComp = dot(i, t);
    return normComp*n*mn + tanComp*t*mt;
}

vec3 draw(vec2 coord, vec2 pos, bool stomped)
{
    vec2 m = (coord - g[0].xy * .5) / g[0].y;
    m.x += g[0].w;
    m *= 3.5;
    m.y -= .9;

    if (length(m-pos) < .05) {
        m -= pos;
        vec3 col = stomped ? vec3(1,0,0) : 1.-i_GROUND_A;
        float x = max((8.*length(m-vec2(.04))) + .9,0.);
        col *= 1./x/x;
        return col;
    } else {
        vec3 fc = worldColor(m, g[0].w, i_GROUND_A);
        if (fc == vec3(0)) {
            fc = worldColor(2.*m - 3.*vec2(g[0].w-99.,-.1), g[0].w, i_GROUND_B);
            if (fc == vec3(0)) {
                fc = worldColor(4.*m - 8.*vec2(g[0].w-99.,0), g[0].w, i_GROUND_B);
                if (fc == vec3(0)) {
                    fc = i_SKY;
                } else {
                    fc = mix(fc, i_SKY, .6);
                }
            } else {
                fc = mix(fc, i_SKY, .3);
            }
        }
        return fc;
    }
}

void main()
{
    vec2 coord = gl_FragCoord.xy;
    vec2 pos = vec2(readFloat(g[1].xy), readFloat(g[1].zw));
    pos.x += g[3].x;
    pos *= 3.5;

    vec2 vel = vec2(readFloat(g[2].xy), readFloat(g[2].zw));
    vec3 colInfo;

    bool left  = mod(g[0].z,      2.) > .9;
    bool right = mod(g[0].z / 2., 2.) > .9;
    bool up    = mod(g[0].z / 4., 2.) > .9;
    bool down  = mod(g[0].z / 8., 2.) > .9;
    seed = floor(g[0].z / 16.);

    bool stomped = mod(g[3].z,      2.) > .9;
    bool dashed  = mod(g[3].z / 2., 2.) > .9;
    bool grounded = mod(g[3].z / 4., 2.) > .9;
    float counter = g[3].w;

// Rendering

    vec3 za = draw(coord+.5*vec2(-.75, .25),pos,stomped);
    vec3 zb = draw(coord+.5*vec2(-.25,-.75),pos,stomped);
    vec3 zc = draw(coord+.5*vec2( .25, .75),pos,stomped);
    vec3 zd = draw(coord+.5*vec2( .75,-.25),pos,stomped);
    gl_FragColor = vec4(.25*(za+zb+zc+zd), 1);

// State update

    if (coord.y < 1. && coord.x < 4.)
    {
        vel.y -= 0.01;
        pos += 0.05 * vel;

        if (collision(pos, g[0].w, colInfo)) {
            if (!grounded) {
            }
            grounded = true;

            if (dot(colInfo.xy, vel) < 0.) {
                pos += colInfo.xy * (colInfo.z + 0.045);
                vel = reflect2(vel, colInfo.xy, 1., 0.);
            }
        } else if (grounded) {
            counter++;
            if (counter > 5.) {
                grounded = false;
                stomped = false;
                dashed = false;
                counter = 0.;
            }
        }
        if (!stomped && down) {
            stomped = true;
            dashed = true;
            vel.y = -1.;
        }
        if (!dashed && right) {
            dashed = true;
            vel.x += .5 - .5*vel.x;
        }

        gl_FragColor = vec4(0, 0, ((stomped?1.:0.)+(dashed?2.:0.)+(grounded?4.:0.))/255., counter/255.);
        if (coord.x < 2.) {
            pos /= 3.5;
            pos.x -= g[0].w;
            gl_FragColor = vec4(writeFloat(pos.x), writeFloat(pos.y)); // g[1]
        }
        else if (coord.x < 3.) {
            gl_FragColor = vec4(writeFloat(vel.x), writeFloat(vel.y)); // g[2]
        }
    }
}