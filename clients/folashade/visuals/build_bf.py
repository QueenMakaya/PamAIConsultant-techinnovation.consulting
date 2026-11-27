exec(open('build.py').read())
X=f"""
.s{{position:relative;overflow:hidden;width:1080px;height:1920px}}
.full{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.tag{{display:inline-block;background:{T};color:{CREAM};font-weight:700;font-size:30px;letter-spacing:.16em;text-transform:uppercase;padding:16px 30px;border-radius:999px}}
.badge{{display:inline-block;background:{CREAM};color:{T};font-weight:700;font-size:40px;padding:18px 34px;border-radius:999px}}
.logo{{position:absolute;top:140px;left:50%;transform:translateX(-50%);height:150px}}
"""
def st(name,body): page(name,1080,1920,body,X)
GRAD="linear-gradient(180deg,rgba(26,21,18,.55) 0,rgba(26,21,18,0) 22%,rgba(26,21,18,0) 48%,rgba(26,21,18,.9) 74%,rgba(26,21,18,.96) 100%)"
st('story-bf-1',f"""<div class='s terra' style='text-align:center'><div class='bg' style="background:{T} {pat('#B24A22','#D96A3C','#B24A22',1,240)};background-size:240px 240px;opacity:.55"></div>
<div class='bg' style='background:radial-gradient(circle at 50% 48%,{T} 0,{T} 38%,rgba(201,86,41,.4) 80%)'></div>
<img class='logo' src='logo-cream.png'>
<div class='z' style='padding-top:560px'>
<div class='eye' style='color:{SAND};font-size:30px'>C'est parti</div>
<h1 style='font-size:150px;line-height:1'>Vendredi <i style='color:{SAND}'>fou</i></h1>
<div style='font-family:FSerif;font-size:330px;line-height:1;margin-top:40px'>-25<span style='font-size:180px'>%</span></div>
<div style='font-size:52px;font-weight:600;margin-top:10px'>sur toute la boutique</div>
<div class='badge' style='margin-top:80px'>Jusqu'à -50 % sur certaines pièces</div>
</div>
<div style='position:absolute;left:0;right:0;bottom:200px;font-size:40px;font-weight:700'>Magasine en ligne · lien en bio</div></div>""")
def prod(n,img,tag,name,price,pos='50% 30%'):
    st(n,f"""<div class='s ink'><img class='full' src='ph/{img}' style='object-position:{pos}'><div class='bg' style='background:{GRAD}'></div>
<img class='logo' src='logo-cream.png' style='height:120px;top:110px'>
<div style='position:absolute;left:90px;right:90px;bottom:230px'>
<div class='tag'>{tag}</div>
<h1 style='font-size:92px;margin-top:34px'>{name}</h1>
<div style='display:flex;align-items:center;gap:30px;margin-top:30px'><span style='font-family:FSerif;font-size:110px'>{price}</span><span class='badge' style='background:{T};color:{CREAM}'>-25 % ce Vendredi fou</span></div></div>
<div style='position:absolute;left:0;right:0;bottom:120px;text-align:center;font-size:38px;font-weight:700'>Magasine en ligne · lien en bio</div></div>""")
prod('story-bf-robe','Folashade_-Robe_Rouge_Dec_2026.jpeg','Vendredi fou','La robe Folashade','60 $','50% 25%')
prod('story-bf-homme','Folashade_-Homme_2_Dec_2026.jpeg','Pour lui','L’ensemble homme en wax','100 $','50% 25%')
prod('story-bf-veste','Folashade_-_Veste_+_Bijoux_1_Dec_2026.jpeg','Vendredi fou','La veste imprimée','100 $','50% 30%')
prod('story-bf-bijoux','Folashade_-_Bijoux1_Dec_2026.jpeg','Les bijoux','Bijoux Folashade','110 $','50% 40%')
