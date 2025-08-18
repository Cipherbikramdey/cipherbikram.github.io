
// JSON-driven resource loader with search, filter, pagination, tabs, and copy buttons
(async function(){
  const state = {
    data: [],
    filtered: [],
    page: 1,
    perPage: 10,
    type: 'all',
    search: ''
  };

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  async function fetchData(){
    const res = await fetch('resources.json', {cache: 'no-store'});
    state.data = await res.json();
    state.filtered = state.data;
    render();
  }

  function filterData(){
    const s = state.search.trim().toLowerCase();
    state.filtered = state.data.filter(item => {
      const matchType = state.type === 'all' || item.type === state.type;
      const matchSearch = !s || (item.name.toLowerCase().includes(s) || (item.topic||'').toLowerCase().includes(s) || (item.tags||[]).join(' ').toLowerCase().includes(s));
      return matchType && matchSearch;
    });
    state.page = 1;
  }

  function paginated(){
    const start = (state.page - 1) * state.perPage;
    return state.filtered.slice(start, start + state.perPage);
  }

  function card(item){
    const icon = {
      pdf: "📄",
      code: "🧩",
      image: "🖼️",
      video: "🎬",
      notes: "📝"
    }[item.type] || "📁";

    let actions = `<a href="${item.path}" target="_blank" class="btn">Open</a>`;
    if(item.type === 'code'){
      actions += ` <button class="btn btn-copy" data-path="${item.path}">Copy</button>`;
    }

    return `
      <div class="card fade-in">
        <div class="card-top">
          <span class="icon">${icon}</span>
          <div class="meta">
            <div class="name">${item.name}</div>
            <div class="sub">${item.topic || ''} · ${item.type.toUpperCase()} · ${item.date || ''}</div>
          </div>
        </div>
        <div class="tags">${(item.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join(' ')}</div>
        <div class="actions">${actions}</div>
      </div>
    `;
  }

  function render(){
    filterData();
    const list = $("#resource-list");
    list.innerHTML = paginated().map(card).join('');

    // Pagination
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.perPage));
    const pg = $("#pagination");
    pg.innerHTML = `
      <button class="btn" data-page="prev" ${state.page===1?'disabled':''}>Prev</button>
      <span class="page-state">Page ${state.page} / ${totalPages}</span>
      <button class="btn" data-page="next" ${state.page===totalPages?'disabled':''}>Next</button>
    `;

    // Count
    $("#count").textContent = `${state.filtered.length} item(s)`;
  }

  // Events
  document.addEventListener("click", async (e)=>{
    const t = e.target;
    if(t.matches('[data-tab]')){
      state.type = t.getAttribute('data-tab');
      $$('.tab').forEach(el=>el.classList.remove('active'));
      t.classList.add('active');
      render();
    }
    if(t.matches('#search-btn')){
      state.search = $('#search-input').value;
      render();
    }
    if(t.matches('#clear-btn')){
      state.search = '';
      $('#search-input').value = '';
      render();
    }
    if(t.matches('[data-page]')){
      const dir = t.getAttribute('data-page');
      const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.perPage));
      if(dir === 'prev' && state.page > 1) state.page--;
      if(dir === 'next' && state.page < totalPages) state.page++;
      render();
    }
    if(t.matches('.btn-copy')){
      const path = t.getAttribute('data-path');
      try {
        const res = await fetch(path);
        const code = await res.text();
        await navigator.clipboard.writeText(code);
        t.textContent = 'Copied!';
        setTimeout(()=>t.textContent='Copy', 1200);
      } catch(err){
        t.textContent = 'Failed';
        setTimeout(()=>t.textContent='Copy', 1200);
      }
    }
  });

  $("#search-input").addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
      state.search = e.target.value;
      render();
    }
  });

  fetchData();
})();
