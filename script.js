import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { registeredPets } from './data.js';

const TOTAL_SLOTS = 365;
const HEADER_HEIGHT = 50;
const GRID_PADDING = 12;
const GRID_GAP = 4;
const MOBILE_BREAKPOINT = 768;
const MOBILE_TARGET_CELL = 44;
const VIEW_REFRESH_MS = 10000;

const slotGrid = document.getElementById('slotGrid');
const topBar = document.querySelector('.top-bar');
const adBanner = document.querySelector('.ad-banner');

const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalViews = document.getElementById('modalViews');
const modalClose = document.getElementById('modalClose');
const rankingTicker = document.getElementById('rankingTicker');

const requestModal = document.getElementById('requestModal');
const requestSlotNumber = document.getElementById('requestSlotNumber');
const requestModalClose = document.getElementById('requestModalClose');
const goToFormButton = document.getElementById('goToFormButton');
const cancelFormButton = document.getElementById('cancelFormButton');

let selectedSlotNumber = null;

const FORM_URL_TEMPLATE =
  'https://docs.google.com/forms/d/e/1FAIpQLSdHOskkCylXlN5_4ugreP1Vx7fVnYPQ5btfu_07yBn7SdbuoA/viewform?usp=pp_url&entry.1362014499=__SLOT__';

const SUPABASE_URL = 'https://gvcmbuvtetttwqudkagi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y21idXZ0ZXR0dHdxdWRrYWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg4NjcsImV4cCI6MjA5MTQ4NDg2N30.ZDmZTxJ_ej5Dqzg5P0ppt9j9Ca8YuuMjFeIyolcohK4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function applyViewRows(viewRows = []) {
  const viewMap = new Map(
    viewRows.map((row) => [Number(row.slot_number), Number(row.views) || 0])
  );

  Object.entries(registeredPets).forEach(([slotNumber, pet]) => {
    pet.views = viewMap.get(Number(slotNumber)) ?? pet.views ?? 0;
  });
}

async function loadViewsFromSupabase() {
  const slotNumbers = Object.keys(registeredPets).map(Number);

  const { data, error } = await supabase
    .from('pet_views')
    .select('slot_number, views')
    .in('slot_number', slotNumbers);

  if (error) {
    console.error('Supabase 조회수 로딩 실패:', error.message);
    return;
  }

  const rows = data ?? [];
  applyViewRows(rows);

  const missingRows = slotNumbers
    .filter((slotNumber) => !rows.some((row) => Number(row.slot_number) === slotNumber))
    .map((slotNumber) => ({
      slot_number: slotNumber,
      views: registeredPets[slotNumber]?.views ?? 0
    }));

  if (missingRows.length > 0) {
    const { error: seedError } = await supabase
      .from('pet_views')
      .upsert(missingRows, { onConflict: 'slot_number' });

    if (seedError) {
      console.error('Supabase 기본 조회수 생성 실패:', seedError.message);
    }
  }
}

async function incrementPetView(slotNumber) {
  const { data, error } = await supabase
    .from('pet_views')
    .select('views')
    .eq('slot_number', slotNumber)
    .maybeSingle();

  if (error) {
    console.error('Supabase 조회수 조회 실패:', error.message);
  }

  const nextViews = (data?.views ?? registeredPets[slotNumber]?.views ?? 0) + 1;
  registeredPets[slotNumber].views = nextViews;

  const { error: upsertError } = await supabase
    .from('pet_views')
    .upsert({ slot_number: slotNumber, views: nextViews }, { onConflict: 'slot_number' });

  if (upsertError) {
    console.error('Supabase 조회수 저장 실패:', upsertError.message);
  }

  return nextViews;
}

function getSlotType() {
  return 'basic';
}

function getSlotBadgeText() {
  return '';
}

function getSortedPetsByViews() {
  return Object.entries(registeredPets)
    .slice()
    .sort((a, b) => (b[1].views || 0) - (a[1].views || 0));
}

function getCrownIcon(slotNumber) {
  const rankIndex = getSortedPetsByViews().findIndex(
    ([currentSlot]) => Number(currentSlot) === slotNumber
  );

  if (rankIndex >= 0 && rankIndex < 3) {
    return '👑';
  }

  return '';
}

function createSlotCard(slotNumber) {
  const type = getSlotType(slotNumber);
  const pet = registeredPets[slotNumber];
  const card = document.createElement('div');

  card.className = `slot-card ${type}`;

  const badgeText = getSlotBadgeText(type);
  const crownIcon = pet ? getCrownIcon(slotNumber) : '';
  const crownRank = crownIcon
    ? getSortedPetsByViews().findIndex(([currentSlot]) => Number(currentSlot) === slotNumber) + 1
    : 0;
  const crownClass = crownRank ? `rank-${crownRank}` : '';

  card.innerHTML = `
    ${badgeText ? `<span class="slot-badge">${badgeText}</span>` : ''}
    ${crownIcon ? `<span class="crown-icon ${crownClass}">${crownIcon}</span>` : ''}
    <span class="slot-number">#${slotNumber}</span>
    ${
      pet
        ? `<img class="slot-image" src="${pet.image}" alt="${pet.name}" />`
        : '<div class="slot-empty">빈 슬롯</div>'
    }
  `;

  if (pet) {
    card.classList.add('has-image');
    card.addEventListener('click', () => {
      void openImageModal(slotNumber, pet);
    });
  } else {
    card.classList.add('is-empty');
    card.addEventListener('click', () => openRequestModal(slotNumber));
  }

  return card;
}

function renderSlots() {
  const fragment = document.createDocumentFragment();

  for (let i = 1; i <= TOTAL_SLOTS; i += 1) {
    fragment.appendChild(createSlotCard(i));
  }

  slotGrid.innerHTML = '';
  slotGrid.appendChild(fragment);
  updateRankingTicker();
}

function updateRankingTicker() {
  if (!rankingTicker) return;

  const topPets = getSortedPetsByViews().slice(0, 5);
  const rankingItems = topPets
    .map(
      ([slotNumber, pet], index) =>
        `<span class="rank-${index + 1}">${index + 1}등 #${slotNumber} ${pet.name}<span class="ticker-crown rank-${index + 1}">👑</span></span>`
    )
    .join('');

  rankingTicker.innerHTML = `
    <div class="ranking-ticker__track">
      <div class="ranking-ticker__group">${rankingItems}</div>
      <div class="ranking-ticker__group" aria-hidden="true">${rankingItems}</div>
    </div>
  `;
}

function calculateBestGrid(total, width, height) {
  let best = {
    columns: 1,
    rows: total,
    cellSize: 0
  };

  for (let columns = 1; columns <= total; columns += 1) {
    const rows = Math.ceil(total / columns);
    const cellWidth = (width - GRID_GAP * (columns - 1)) / columns;
    const cellHeight = (height - GRID_GAP * (rows - 1)) / rows;
    const cellSize = Math.floor(Math.min(cellWidth, cellHeight));

    if (cellSize > best.cellSize) {
      best = { columns, rows, cellSize };
    }
  }

  return best;
}

function applyGridLayout() {
  const viewportWidth = window.innerWidth;

  if (viewportWidth <= MOBILE_BREAKPOINT) {
    const mobileUsableWidth = Math.max(viewportWidth - GRID_PADDING, 280);
    const columns = Math.max(
      4,
      Math.min(8, Math.floor((mobileUsableWidth + GRID_GAP) / (MOBILE_TARGET_CELL + GRID_GAP)))
    );
    const rows = Math.ceil(TOTAL_SLOTS / columns);
    const cellSize = Math.floor(
      (mobileUsableWidth - GRID_GAP * (columns - 1)) / columns
    );

    slotGrid.style.gridTemplateColumns = `repeat(${columns}, ${cellSize}px)`;
    slotGrid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    return;
  }

  const topBarHeight = topBar?.offsetHeight || HEADER_HEIGHT;
  const adBannerHeight = adBanner?.offsetHeight || 0;
  const reservedHeight = topBarHeight + adBannerHeight + 12;

  const viewportHeight = window.innerHeight - reservedHeight;

  const usableWidth = viewportWidth - GRID_PADDING;
  const usableHeight = Math.max(viewportHeight - GRID_PADDING, 120);

  const { columns, rows, cellSize } = calculateBestGrid(
    TOTAL_SLOTS,
    usableWidth,
    usableHeight
  );

  slotGrid.style.gridTemplateColumns = `repeat(${columns}, ${cellSize}px)`;
  slotGrid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
}

async function openImageModal(slotNumber, pet) {
  modalImage.src = pet.image;
  modalImage.alt = pet.name;
  modalTitle.textContent = pet.name;
  modalDesc.textContent = pet.desc;
  if (modalViews) {
    modalViews.textContent = `조회수 ${pet.views || 0}`;
  }
  imageModal.classList.remove('hidden');
  imageModal.setAttribute('aria-hidden', 'false');

  const updatedViews = await incrementPetView(slotNumber);
  if (modalViews) {
    modalViews.textContent = `조회수 ${updatedViews}`;
  }
  renderSlots();
}

function closeImageModal() {
  imageModal.classList.add('hidden');
  imageModal.setAttribute('aria-hidden', 'true');
  modalImage.src = '';
}

function openRequestModal(slotNumber) {
  selectedSlotNumber = slotNumber;
  requestSlotNumber.textContent = `${slotNumber}번`;
  requestModal.classList.remove('hidden');
  requestModal.setAttribute('aria-hidden', 'false');
}

function closeRequestModal() {
  requestModal.classList.add('hidden');
  requestModal.setAttribute('aria-hidden', 'true');
  selectedSlotNumber = null;
}

function goToGoogleForm() {
  if (!selectedSlotNumber) return;

  const finalUrl = FORM_URL_TEMPLATE.replace(
    '__SLOT__',
    encodeURIComponent(String(selectedSlotNumber))
  );

  window.open(finalUrl, '_blank', 'noopener,noreferrer');
  closeRequestModal();
}

modalClose.addEventListener('click', closeImageModal);

imageModal.addEventListener('click', (event) => {
  const isBackdrop =
    event.target.classList.contains('image-modal__backdrop') ||
    event.target === imageModal;

  if (isBackdrop) {
    closeImageModal();
  }
});

requestModalClose.addEventListener('click', closeRequestModal);
cancelFormButton.addEventListener('click', closeRequestModal);
goToFormButton.addEventListener('click', goToGoogleForm);

requestModal.addEventListener('click', (event) => {
  if (event.target.classList.contains('request-modal__backdrop')) {
    closeRequestModal();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!imageModal.classList.contains('hidden')) {
      closeImageModal();
    }
    if (!requestModal.classList.contains('hidden')) {
      closeRequestModal();
    }
  }
});

window.addEventListener('resize', applyGridLayout);

async function initializeApp() {
  renderSlots();
  applyGridLayout();

  await loadViewsFromSupabase();
  renderSlots();
  applyGridLayout();

  window.setInterval(() => {
    void loadViewsFromSupabase().then(() => {
      renderSlots();
    });
  }, VIEW_REFRESH_MS);
}

void initializeApp();
