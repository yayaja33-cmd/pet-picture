import { registeredPets } from './data.js';

const TOTAL_SLOTS = 365;
const HEADER_HEIGHT = 50;
const GRID_PADDING = 12;
const GRID_GAP = 4;

const slotGrid = document.getElementById('slotGrid');
const topBar = document.querySelector('.top-bar');

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

const premiumSlots = new Set([1, 365]);

let selectedSlotNumber = null;

const FORM_URL_TEMPLATE =
  'https://docs.google.com/forms/d/e/1FAIpQLSdHOskkCylXlN5_4ugreP1Vx7fVnYPQ5btfu_07yBn7SdbuoA/viewform?usp=pp_url&entry.1362014499=__SLOT__';

function loadViewsFromStorage() {
  const savedViews = localStorage.getItem('petViews');
  if (!savedViews) return;

  const viewsData = JSON.parse(savedViews);
  Object.keys(registeredPets).forEach((slotNumber) => {
    if (viewsData[slotNumber] !== undefined) {
      registeredPets[slotNumber].views = viewsData[slotNumber];
    }
  });
}

function saveViewsToStorage() {
  const viewsData = {};
  Object.keys(registeredPets).forEach((slotNumber) => {
    viewsData[slotNumber] = registeredPets[slotNumber].views || 0;
  });
  localStorage.setItem('petViews', JSON.stringify(viewsData));
}

function getSlotType(slotNumber) {
  if (premiumSlots.has(slotNumber)) return 'premium';
  return 'basic';
}

function getSlotBadgeText(type) {
  if (type === 'premium') return 'Premium';
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
    card.addEventListener('click', () => openImageModal(pet));
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
  const topBarHeight = topBar?.offsetHeight || HEADER_HEIGHT;
  const reservedHeight = topBarHeight;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight - reservedHeight;

  const usableWidth = viewportWidth - GRID_PADDING;
  const usableHeight = viewportHeight - GRID_PADDING;

  const { columns, rows, cellSize } = calculateBestGrid(
    TOTAL_SLOTS,
    usableWidth,
    usableHeight
  );

  slotGrid.style.gridTemplateColumns = `repeat(${columns}, ${cellSize}px)`;
  slotGrid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
}

function openImageModal(pet) {
  pet.views = (pet.views || 0) + 1;
  saveViewsToStorage();
  renderSlots();

  modalImage.src = pet.image;
  modalImage.alt = pet.name;
  modalTitle.textContent = pet.name;
  modalDesc.textContent = pet.desc;
  if (modalViews) {
    modalViews.textContent = `조회수 ${pet.views}`;
  }
  imageModal.classList.remove('hidden');
  imageModal.setAttribute('aria-hidden', 'false');
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

loadViewsFromStorage();
renderSlots();
applyGridLayout();
