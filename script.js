const TOTAL_SLOTS = 365;
const HEADER_HEIGHT = 50;
const GRID_PADDING = 12;
const GRID_GAP = 4;

const slotGrid = document.getElementById('slotGrid');

const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalViews = document.getElementById('modalViews');
const modalClose = document.getElementById('modalClose');

const requestModal = document.getElementById('requestModal');
const requestSlotNumber = document.getElementById('requestSlotNumber');
const requestModalClose = document.getElementById('requestModalClose');
const goToFormButton = document.getElementById('goToFormButton');
const cancelFormButton = document.getElementById('cancelFormButton');

const premiumSlots = new Set([1, 365]);

let selectedSlotNumber = null;

/*
  슬롯 번호 자동 입력용 구글폼 링크
  entry.1362014499 = 슬롯 번호
*/
const FORM_URL_TEMPLATE =
  'https://docs.google.com/forms/d/e/1FAIpQLSdHOskkCylXlN5_4ugreP1Vx7fVnYPQ5btfu_07yBn7SdbuoA/viewform?usp=pp_url&entry.1362014499=__SLOT__';

/*
  샘플 등록 데이터
  실제 운영할 때는 네가 승인한 슬롯만 여기에 넣거나
  나중에 DB/JSON으로 빼면 됨
*/
const registeredPets = {
  176: {
    name: '콩지',
    desc: '롱다리 강아지',
    image: 'https://i.postimg.cc/G2xd4Xks/kongji(175).jpg',
    registeredAt: Date.now()
  },
  4: {
    name: '산이',
    desc: '예산 효자골 풍산개',
    image: 'https://i.postimg.cc/QCQbK7yn/san-i(4).jpg',
    registeredAt: Date.now()
  },
  88: {
    name: '무지개8남매',
    desc: '탄이산이 새끼들',
    image: 'https://i.postimg.cc/d1KwjP0G/mujigae8nammae(88).jpg',
    registeredAt: Date.now()
  },
  103: {
    name: '탄이',
    desc: '예천 효자골 블랙탄 진돗개',
    image: 'https://i.postimg.cc/KY4h7cF9/tan-i(103).jpg',
    registeredAt: Date.now()
  }
};

function getSlotType(slotNumber) {
  if (premiumSlots.has(slotNumber)) return 'premium';
  return 'basic';
}

function getSlotBadgeText(type) {
  if (type === 'premium') return 'Premium';
  return '';
}

function createSlotCard(slotNumber) {
  const type = getSlotType(slotNumber);
  const pet = registeredPets[slotNumber];
  const card = document.createElement('div');

  card.className = `slot-card ${type}`;

  const badgeText = getSlotBadgeText(type);

  card.innerHTML = `
    ${badgeText ? `<span class="slot-badge">${badgeText}</span>` : ''}
    <span class="slot-number">#${slotNumber}</span>
    ${
      pet
        ? `<img class="slot-image" src="${pet.image}" alt="${pet.name}" />`
        : `<div class="slot-empty">빈 슬롯</div>`
    }
  `;

  if (pet) {
    card.classList.add('has-image');
    card.addEventListener('click', () => openImageModal(pet));
    const image = card.querySelector('.slot-image');
    if (image) {
      image.addEventListener('click', () => openImageModal(pet));
    }
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
  const viewportHeight = window.innerHeight - HEADER_HEIGHT;

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
  modalImage.src = pet.image;
  modalImage.alt = pet.name;
  modalTitle.textContent = pet.name;
  modalDesc.textContent = pet.desc;
  if (modalViews) {
    modalViews.textContent = `조회수 ${pet.views || 0}회`;
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

renderSlots();
applyGridLayout();