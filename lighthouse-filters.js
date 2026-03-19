/* Lighthouse Aquatics — Collection Filters v1 */
/* Tag-based & category-based filtering for Lightspeed/Ecwid */

(function () {
  'use strict';

  /* ── Config ── */
  var STORE_ID = '132229530';
  var TOKEN = 'public_Qn1DGne1nuyH457RsSLmYgQJ1XRrGZXe';
  var API = 'https://app.ecwid.com/api/v3/' + STORE_ID;
  var LIMIT = 100; // max per API call

  /* Category IDs from Lightspeed */
  var CAT_IDS = {
    'corals-lps':              197026558,
    'corals-soft':             197026563,
    'corals-sps':              197026566,
    'equipment':               197017307,
    'aquariums':               197017308,
    'food-frozen':             197017310,
    'supplements':             197017312,
    'food-dry':                197018306,
    'filtration':              197018310,
    'decoration':              197026562,
    'aquarium-complete-systems': 197026565,
    'dry-goods':               197026567
  };

  /*
   * Virtual collections — pages that pull from MULTIPLE categories
   * and show sub-filters. The key is the URL slug.
   *
   * Each filter has:
   *   label  – display name
   *   match  – function(product) → boolean
   *
   * "All" filter is auto-added.
   */
  var COLLECTIONS = {
    'live-corals': {
      title: 'Live Corals',
      categories: ['corals-lps', 'corals-soft', 'corals-sps'],
      filters: [
        /* ── By category ── */
        { label: 'LPS Corals',   match: function (p) { return catSlug(p) === 'corals-lps'; } },
        { label: 'SPS Corals',   match: function (p) { return catSlug(p) === 'corals-sps'; } },
        { label: 'Soft Corals',  match: function (p) { return catSlug(p) === 'corals-soft'; } },
        /* ── By name keyword ── */
        { label: 'Acropora',     match: function (p) { return nameHas(p, 'acro'); } },
        { label: 'Chalice',      match: function (p) { return nameHas(p, 'chalice'); } },
        { label: 'Torch',        match: function (p) { return nameHas(p, 'torch'); } },
        { label: 'Hammer',       match: function (p) { return nameHas(p, 'hammer'); } },
        { label: 'Frogspawn',    match: function (p) { return nameHas(p, 'frogspawn'); } },
        { label: 'Goniopora',    match: function (p) { return nameHas(p, 'goniopora', 'goni'); } },
        { label: 'Montipora',    match: function (p) { return nameHas(p, 'montipora', 'monti'); } },
        { label: 'Zoanthids',    match: function (p) { return nameHas(p, 'zoanthid', 'zoa'); } },
        { label: 'Mushrooms',    match: function (p) { return nameHas(p, 'mushroom', 'shroom'); } },
        { label: 'Leather',      match: function (p) { return nameHas(p, 'leather', 'toadstool'); } },
        { label: 'Anemones',     match: function (p) { return nameHas(p, 'anemone'); } },
        { label: 'Blastos',      match: function (p) { return nameHas(p, 'blasto'); } }
      ]
    },

    'all-fish': {
      title: 'Fish & Inverts',
      categories: ['livestock', 'saltwater', 'cleaner-crews', 'fresh-water'],
      filters: [
        { label: 'Saltwater Fish', match: function (p) { return catSlug(p) === 'saltwater'; } },
        { label: 'Cleaner Crews',  match: function (p) { return catSlug(p) === 'cleaner-crews'; } },
        { label: 'Clownfish',     match: function (p) { return nameHas(p, 'clown'); } },
        { label: 'Tangs',         match: function (p) { return nameHas(p, 'tang'); } },
        { label: 'Wrasse',        match: function (p) { return nameHas(p, 'wrasse'); } },
        { label: 'Gobies',        match: function (p) { return nameHas(p, 'goby', 'gobies'); } }
      ]
    },

    'aquarium-supplies': {
      title: 'Aquarium Supplies',
      categories: ['equipment', 'aquariums', 'aquarium-complete-systems', 'filtration', 'supplements', 'food-dry', 'food-frozen', 'dry-goods', 'decoration'],
      filters: [
        { label: 'Aquariums',     match: function (p) { return catSlug(p) === 'aquariums'; } },
        { label: 'Complete Systems', match: function (p) { return catSlug(p) === 'aquarium-complete-systems'; } },
        { label: 'Equipment',    match: function (p) { return catSlug(p) === 'equipment'; } },
        { label: 'Filtration',   match: function (p) { return catSlug(p) === 'filtration'; } },
        { label: 'Supplements',  match: function (p) { return catSlug(p) === 'supplements'; } },
        { label: 'Food',         match: function (p) { return catSlug(p) === 'food-dry' || catSlug(p) === 'food-frozen'; } },
        { label: 'Dry Goods',    match: function (p) { return catSlug(p) === 'dry-goods'; } },
        { label: 'Decoration',   match: function (p) { return catSlug(p) === 'decoration'; } }
      ]
    }
  };

  /* ── Helpers ── */
  function catSlug(product) {
    return product._catSlug || '';
  }

  function nameHas(product, /* ...keywords */) {
    var name = (product.name || '').toLowerCase();
    for (var i = 1; i < arguments.length; i++) {
      if (name.indexOf(arguments[i].toLowerCase()) !== -1) return true;
    }
    return false;
  }

  function formatPrice(p) {
    if (p.defaultDisplayedPriceFormatted) return p.defaultDisplayedPriceFormatted;
    return '$' + (p.price || 0).toFixed(2);
  }

  function getImage(p) {
    if (p.hdThumbnailUrl) return p.hdThumbnailUrl;
    if (p.thumbnailUrl) return p.thumbnailUrl;
    if (p.imageUrl) return p.imageUrl;
    return '';
  }

  /* ── Detect current page ── */
  function getSlug() {
    var path = window.location.pathname.replace(/\/$/, '');
    var parts = path.split('/');
    return parts[parts.length - 1] || '';
  }

  /* ── API fetch ── */
  function fetchCategory(catId, offset, callback) {
    var url = API + '/products?category=' + catId +
      '&enabled=true&limit=' + LIMIT +
      '&offset=' + (offset || 0);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('Authorization', 'Bearer ' + TOKEN);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try { callback(null, JSON.parse(xhr.responseText)); }
        catch (e) { callback(e); }
      } else {
        callback(new Error('API ' + xhr.status));
      }
    };
    xhr.onerror = function () { callback(new Error('Network error')); };
    xhr.send();
  }

  function fetchAllFromCategory(catSlugName, catId, allProducts, offset, done) {
    fetchCategory(catId, offset, function (err, data) {
      if (err || !data || !data.items) { done(err); return; }
      data.items.forEach(function (p) {
        p._catSlug = catSlugName;
        allProducts.push(p);
      });
      if (data.items.length === LIMIT) {
        fetchAllFromCategory(catSlugName, catId, allProducts, offset + LIMIT, done);
      } else {
        done(null);
      }
    });
  }

  function fetchCollection(collection, callback) {
    var products = [];
    var pending = collection.categories.length;
    var hasError = false;

    if (pending === 0) { callback(null, []); return; }

    collection.categories.forEach(function (slug) {
      var catId = CAT_IDS[slug];
      if (!catId) {
        pending--;
        if (pending === 0) callback(null, products);
        return;
      }
      fetchAllFromCategory(slug, catId, products, 0, function (err) {
        if (err && !hasError) { hasError = true; callback(err); return; }
        pending--;
        if (pending === 0) callback(null, products);
      });
    });
  }

  /* ── CSS ── */
  function injectCSS() {
    var css = [
      '#lf-root{max-width:1400px;margin:0 auto;padding:20px;display:flex;gap:24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',

      /* Sidebar filters */
      '#lf-sidebar{width:220px;min-width:220px;position:sticky;top:100px;align-self:flex-start}',
      '#lf-sidebar h3{font-size:18px;font-weight:700;margin:0 0 16px;color:#1a3a5c}',
      '.lf-filter{display:block;width:100%;text-align:left;background:none;border:none;padding:10px 14px;font-size:14px;font-weight:500;color:#555;cursor:pointer;border-radius:8px;transition:all 0.15s;margin-bottom:2px}',
      '.lf-filter:hover{background:#f0f4f8;color:#1a3a5c}',
      '.lf-filter.is-active{background:#1a3a5c;color:#fff;font-weight:600}',
      '.lf-count{font-size:12px;color:#999;margin-left:6px;font-weight:400}',
      '.lf-filter.is-active .lf-count{color:rgba(255,255,255,0.7)}',

      /* Price filter */
      '#lf-price-wrap{margin-top:20px;padding-top:16px;border-top:1px solid #eee}',
      '#lf-price-wrap h4{font-size:14px;font-weight:600;margin:0 0 10px;color:#333}',
      '#lf-price-inputs{display:flex;gap:8px;align-items:center}',
      '#lf-price-inputs input{width:70px;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px}',
      '#lf-price-inputs span{color:#999;font-size:13px}',

      /* Sort */
      '#lf-sort-wrap{margin-top:16px;padding-top:16px;border-top:1px solid #eee}',
      '#lf-sort-wrap h4{font-size:14px;font-weight:600;margin:0 0 8px;color:#333}',
      '#lf-sort-wrap select{width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px;background:#fff}',

      /* Product grid */
      '#lf-main{flex:1;min-width:0}',
      '#lf-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}',
      '#lf-header h1{font-size:28px;font-weight:700;margin:0;color:#1a3a5c}',
      '#lf-result-count{font-size:14px;color:#888}',

      '#lf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px}',

      '.lf-card{text-decoration:none;color:#333;border-radius:12px;overflow:hidden;transition:transform 0.15s,box-shadow 0.15s;background:#fff;border:1px solid #f0f0f0}',
      '.lf-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,0.1)}',
      '.lf-card-img{width:100%;aspect-ratio:1;object-fit:cover;background:#f5f5f5;display:block}',
      '.lf-card-body{padding:12px 14px 16px}',
      '.lf-card-name{font-size:14px;font-weight:600;margin:0 0 4px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.lf-card-sku{font-size:12px;color:#999;margin:0 0 6px}',
      '.lf-card-price{font-size:16px;font-weight:700;color:#1a3a5c}',
      '.lf-card-stock{font-size:12px;margin-top:4px}',
      '.lf-card-stock.in{color:#2a9d2a}',
      '.lf-card-stock.out{color:#cc3333}',

      '.lf-badge{position:absolute;top:10px;right:10px;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;z-index:1}',
      '.lf-badge.sold-out{background:#e74c3c;color:#fff}',
      '.lf-badge.on-sale{background:#27ae60;color:#fff}',
      '.lf-card-img-wrap{position:relative}',

      /* Loading / empty */
      '#lf-loading{text-align:center;padding:60px 20px;color:#888;font-size:15px}',
      '#lf-empty{text-align:center;padding:60px 20px;color:#888;font-size:15px}',
      '.lf-spinner{width:36px;height:36px;border:3px solid #eee;border-top-color:#1a3a5c;border-radius:50%;animation:lf-spin 0.8s linear infinite;margin:0 auto 16px}',
      '@keyframes lf-spin{to{transform:rotate(360deg)}}',

      /* Mobile */
      '@media(max-width:768px){',
        '#lf-root{flex-direction:column;padding:12px}',
        '#lf-sidebar{width:100%;min-width:100%;position:static;display:flex;flex-wrap:wrap;gap:6px}',
        '#lf-sidebar h3{width:100%}',
        '.lf-filter{width:auto;padding:8px 14px;font-size:13px;border:1px solid #ddd;border-radius:20px}',
        '.lf-filter.is-active{border-color:#1a3a5c}',
        '#lf-price-wrap,#lf-sort-wrap{border-top:none;padding-top:0;margin-top:8px;width:100%}',
        '#lf-grid{grid-template-columns:repeat(2,1fr);gap:12px}',
      '}'
    ];

    var style = document.createElement('style');
    style.appendChild(document.createTextNode(css.join('\n')));
    document.head.appendChild(style);
  }

  /* ── Render ── */
  function render(container, collection, products) {
    var activeFilter = null;
    var priceMin = null;
    var priceMax = null;
    var sortBy = 'name-asc';

    /* Count products per filter */
    function countFor(filter) {
      if (!filter) return products.length;
      return products.filter(filter.match).length;
    }

    function getFiltered() {
      var list = products;
      if (activeFilter) {
        list = list.filter(activeFilter.match);
      }
      if (priceMin !== null) {
        list = list.filter(function (p) { return p.price >= priceMin; });
      }
      if (priceMax !== null) {
        list = list.filter(function (p) { return p.price <= priceMax; });
      }
      /* Sort */
      list = list.slice().sort(function (a, b) {
        switch (sortBy) {
          case 'price-asc': return (a.price || 0) - (b.price || 0);
          case 'price-desc': return (b.price || 0) - (a.price || 0);
          case 'name-desc': return (b.name || '').localeCompare(a.name || '');
          default: return (a.name || '').localeCompare(b.name || '');
        }
      });
      return list;
    }

    function renderGrid() {
      var filtered = getFiltered();
      var grid = container.querySelector('#lf-grid');
      var countEl = container.querySelector('#lf-result-count');
      countEl.textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '');

      if (filtered.length === 0) {
        grid.innerHTML = '<div id="lf-empty">No products match this filter.</div>';
        return;
      }

      grid.innerHTML = filtered.map(function (p) {
        var img = getImage(p);
        var inStock = p.inStock !== false;
        var badge = '';
        if (!inStock) badge = '<span class="lf-badge sold-out">Sold Out</span>';
        else if (p.compareToPrice && p.compareToPrice > p.price) badge = '<span class="lf-badge on-sale">Sale</span>';

        return '<a class="lf-card" href="' + (p.url || '#') + '">' +
          '<div class="lf-card-img-wrap">' + badge +
          (img ? '<img class="lf-card-img" src="' + img + '" alt="' + (p.name || '') + '" loading="lazy">' :
            '<div class="lf-card-img"></div>') +
          '</div>' +
          '<div class="lf-card-body">' +
          '<p class="lf-card-name">' + (p.name || 'Unnamed') + '</p>' +
          (p.sku ? '<p class="lf-card-sku">SKU ' + p.sku + '</p>' : '') +
          '<div class="lf-card-price">' + formatPrice(p) + '</div>' +
          '<div class="lf-card-stock ' + (inStock ? 'in' : 'out') + '">' +
          (inStock ? 'In stock' : 'Out of stock') + '</div>' +
          '</div></a>';
      }).join('');
    }

    function renderFilters() {
      var sidebar = container.querySelector('#lf-sidebar');
      /* Filter buttons */
      var html = '<h3>' + collection.title + '</h3>';
      html += '<button class="lf-filter is-active" data-idx="-1">All<span class="lf-count">(' + products.length + ')</span></button>';
      collection.filters.forEach(function (f, i) {
        var count = countFor(f);
        if (count === 0) return; /* hide empty filters */
        html += '<button class="lf-filter" data-idx="' + i + '">' + f.label +
          '<span class="lf-count">(' + count + ')</span></button>';
      });

      /* Price filter */
      html += '<div id="lf-price-wrap"><h4>Price</h4>' +
        '<div id="lf-price-inputs">' +
        '<input type="number" id="lf-price-min" placeholder="Min">' +
        '<span>&ndash;</span>' +
        '<input type="number" id="lf-price-max" placeholder="Max">' +
        '</div></div>';

      /* Sort */
      html += '<div id="lf-sort-wrap"><h4>Sort by</h4>' +
        '<select id="lf-sort">' +
        '<option value="name-asc">Name A–Z</option>' +
        '<option value="name-desc">Name Z–A</option>' +
        '<option value="price-asc">Price: Low to High</option>' +
        '<option value="price-desc">Price: High to Low</option>' +
        '</select></div>';

      sidebar.innerHTML = html;

      /* Bind filter clicks */
      sidebar.querySelectorAll('.lf-filter').forEach(function (btn) {
        btn.addEventListener('click', function () {
          sidebar.querySelectorAll('.lf-filter').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          var idx = parseInt(btn.getAttribute('data-idx'));
          activeFilter = idx >= 0 ? collection.filters[idx] : null;
          renderGrid();
          /* Scroll to top of grid on mobile */
          if (window.innerWidth <= 768) {
            container.querySelector('#lf-main').scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      /* Bind price inputs */
      var debounce = null;
      function onPriceChange() {
        clearTimeout(debounce);
        debounce = setTimeout(function () {
          var minVal = container.querySelector('#lf-price-min').value;
          var maxVal = container.querySelector('#lf-price-max').value;
          priceMin = minVal ? parseFloat(minVal) : null;
          priceMax = maxVal ? parseFloat(maxVal) : null;
          renderGrid();
        }, 400);
      }
      container.querySelector('#lf-price-min').addEventListener('input', onPriceChange);
      container.querySelector('#lf-price-max').addEventListener('input', onPriceChange);

      /* Bind sort */
      container.querySelector('#lf-sort').addEventListener('change', function () {
        sortBy = this.value;
        renderGrid();
      });
    }

    renderFilters();
    renderGrid();
  }

  /* ── Init ── */
  function init() {
    var slug = getSlug();
    var collection = COLLECTIONS[slug];
    if (!collection) return; /* not a virtual collection page, do nothing */

    injectCSS();

    /* Wait for Ecwid to finish rendering, then replace content */
    var interval = setInterval(function () {
      /* Find the main content area — Ecwid product browser */
      var productBrowser = document.querySelector('.ec-store') ||
        document.querySelector('[data-ec-store]') ||
        document.querySelector('.ecwid-productBrowser') ||
        document.querySelector('#product-details') ||
        document.querySelector('[class*="ProductBrowser"]');

      /* Also look for the Lightspeed page content wrapper */
      var pageContent = document.querySelector('.page-content') ||
        document.querySelector('main') ||
        document.querySelector('[class*="content"]');

      var target = productBrowser || pageContent;
      if (!target) return;
      clearInterval(interval);

      /* Build our container */
      var root = document.createElement('div');
      root.id = 'lf-root';
      root.innerHTML =
        '<div id="lf-sidebar"></div>' +
        '<div id="lf-main">' +
        '<div id="lf-header">' +
        '<h1>' + collection.title + '</h1>' +
        '<span id="lf-result-count"></span>' +
        '</div>' +
        '<div id="lf-grid">' +
        '<div id="lf-loading"><div class="lf-spinner"></div>Loading products...</div>' +
        '</div>' +
        '</div>';

      /* Replace the product browser content */
      target.innerHTML = '';
      target.appendChild(root);

      /* Update page title */
      var pageTitle = document.querySelector('h1');
      if (pageTitle && pageTitle !== root.querySelector('h1')) {
        pageTitle.style.display = 'none';
      }

      /* Fetch and render */
      fetchCollection(collection, function (err, products) {
        if (err) {
          root.querySelector('#lf-grid').innerHTML =
            '<div id="lf-empty">Error loading products. Please refresh.</div>';
          console.error('LF fetch error:', err);
          return;
        }

        /* Deduplicate by product ID */
        var seen = {};
        products = products.filter(function (p) {
          if (seen[p.id]) return false;
          seen[p.id] = true;
          return true;
        });

        console.log('Lighthouse filters: loaded ' + products.length + ' products');
        render(root, collection, products);
      });
    }, 500);

    /* Safety timeout */
    setTimeout(function () { clearInterval(interval); }, 15000);
  }

  /* Run on page load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('Lighthouse collection filters loaded');
})();
