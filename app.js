const state={categories:[],materials:[],categoryId:null,materialId:null,query:""};
const $=id=>document.getElementById(id);
const els={grid:$("categoryGrid"),list:$("listView"),article:$("articleView"),title:$("pageTitle"),subtitle:$("pageSubtitle"),back:$("backButton"),empty:$("emptyState"),search:$("searchInput"),clear:$("clearSearch")};

async function loadData(){
  try{
    const [c,m]=await Promise.all([fetch("./data/categories.json"),fetch("./data/materials.json")]);
    if(!c.ok||!m.ok)throw new Error("JSON файлдары жүктелмеді");
    state.categories=await c.json();state.materials=await m.json();render();
  }catch(err){
    els.grid.innerHTML='<div class="empty-state">Деректерді жүктеу мүмкін болмады. GitHub репозиторийінде data/categories.json және data/materials.json файлдары бар екенін тексеріңіз.</div>';
    console.error(err);
  }
}
function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function markdownLite(text=""){
  // JSON материалдарына арналған жеңіл Markdown: тақырыптар, тізімдер, қалың мәтін.
  let html=escapeHTML(text);
  html=html.replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>");
  const lines=html.split("\n");let out="",list=null;
  for(const line of lines){
    if(/^\s*[-*] /.test(line)){
      if(list!=="ul"){if(list)out+="</ol>";out+="<ul>";list="ul";}
      out+="<li>"+line.replace(/^\s*[-*] /,"")+"</li>";
    }else if(/^\s*\d+\. /.test(line)){
      if(list!=="ol"){if(list)out+=list==="ul"?"</ul>":"</ol>";out+="<ol>";list="ol";}
      out+="<li>"+line.replace(/^\s*\d+\. /,"")+"</li>";
    }else{
      if(list){out+=list==="ul"?"</ul>":"</ol>";list=null;}
      if(line.trim().startsWith("<h"))out+=line;
      else if(line.trim())out+="<p>"+line+"</p>";
    }
  }
  if(list)out+=list==="ul"?"</ul>":"</ol>";
  return out;
}
function setView(which){
  els.grid.classList.toggle("hidden",which!=="grid");
  els.list.classList.toggle("hidden",which!=="list");
  els.article.classList.toggle("hidden",which!=="article");
  els.back.classList.toggle("hidden",which==="grid");
  els.empty.classList.add("hidden");
}
function render(){
  const q=state.query.trim().toLocaleLowerCase("kk");
  if(q){
    state.categoryId=null;state.materialId=null;
    const found=state.materials.filter(m=>(m.title+" "+m.summary).toLocaleLowerCase("kk").includes(q));
    els.title.textContent="Іздеу нәтижелері";els.subtitle.textContent=`Табылған материалдар: ${found.length}`;
    renderRows(found);setView("list");return;
  }
  if(state.materialId){
    const m=state.materials.find(x=>x.id===state.materialId);
    if(!m){goHome();return;}
    els.title.textContent=state.categories.find(c=>c.id===m.categoryId)?.title||"Материал";
    els.subtitle.textContent="Оқу материалы";
    els.article.innerHTML=`<h2 class="article-title">${escapeHTML(m.title)}</h2><p class="article-summary">${escapeHTML(m.summary||"")}</p><div class="article-content">${markdownLite(m.content||"")}</div>`;
    setView("article");return;
  }
  if(state.categoryId){
    const c=state.categories.find(x=>x.id===state.categoryId);
    if(!c){goHome();return;}
    const rows=state.materials.filter(m=>m.categoryId===c.id);
    els.title.textContent=c.title;els.subtitle.textContent=c.description||"Материалдар";
    renderRows(rows);setView("list");return;
  }
  els.title.textContent="Анықтамалық";els.subtitle.textContent="Криминалистика және қылмыстық процесс материалдары";
  els.grid.innerHTML=state.categories.map(c=>`<button class="category-card" data-category="${escapeHTML(c.id)}"><span class="category-icon" aria-hidden="true">${escapeHTML(c.icon||"📚")}</span><span class="category-title">${escapeHTML(c.title)}</span></button>`).join("");
  setView("grid");
}
function renderRows(rows){
  els.list.innerHTML=rows.map(m=>`<button class="material-row" data-material="${escapeHTML(m.id)}"><span class="material-icon" aria-hidden="true">📁</span><span class="material-copy"><h2>${escapeHTML(m.title)}</h2><p>${escapeHTML(m.summary||"")}</p></span><span class="chevron">›</span></button>`).join("");
  if(!rows.length){els.empty.classList.remove("hidden");}
}
function goHome(){state.categoryId=null;state.materialId=null;state.query="";els.search.value="";els.clear.style.display="none";render();window.location.hash="";}
function goBack(){
  if(state.materialId){state.materialId=null;render();return;}
  if(state.categoryId){state.categoryId=null;render();return;}
  goHome();
}
els.grid.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){state.categoryId=b.dataset.category;render();}});
els.list.addEventListener("click",e=>{const b=e.target.closest("[data-material]");if(b){state.materialId=b.dataset.material;render();window.scrollTo({top:0,behavior:"smooth"});}});
els.back.addEventListener("click",goBack);
els.search.addEventListener("input",()=>{state.query=els.search.value;els.clear.style.display=state.query?"block":"none";render();});
els.clear.addEventListener("click",()=>{els.search.value="";state.query="";els.clear.style.display="none";render();});
$("homeButton").addEventListener("click",goHome);
$("menuButton").addEventListener("click",()=>toggleDrawer(true));
$("closeDrawer").addEventListener("click",()=>toggleDrawer(false));
$("scrim").addEventListener("click",()=>toggleDrawer(false));
document.querySelector("[data-home]").addEventListener("click",()=>{toggleDrawer(false);goHome();});
function toggleDrawer(open){$("drawer").classList.toggle("open",open);$("scrim").classList.toggle("show",open);$("drawer").setAttribute("aria-hidden",String(!open));}
window.addEventListener("hashchange",()=>{if(location.hash==="#home")goHome();});
loadData();