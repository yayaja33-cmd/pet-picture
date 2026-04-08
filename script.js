const TOTAL_SLOTS = 365;
const HEADER_HEIGHT = 50;
const GRID_PADDING = 12;
const GRID_GAP = 4;

const slotGrid = document.getElementById('slotGrid');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalClose = document.getElementById('modalClose');

const featuredSlots = new Set([1, 2, 3, 4, 5, 6]);
const premiumSlots = new Set([25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350]);

/*
  샘플 등록 데이터
  나중에는 서버/DB 데이터로 바꾸면 됨.
  image는 지금 임시 이미지 주소를 넣어둔 거라,
  실제 운영할 때는 업로드한 이미지 URL로 바꾸면 됨.
*/
const registeredPets = {
  1: {
    name: '콩이',
    desc: '우리집 첫 번째 친구',
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80'
  },
  8: {
    name: '초코',
    desc: '햇살 좋아하던 강아지',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80'
  },
  32: {
    name: '보리',
    desc: '장난꾸러기 고양이',
    image: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=1200&q=80'
  },
  77: {
    name: '두부',
    desc: '항상 곁에 있던 아이',
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&q=80'
  }
};

function getSlotType(slotNumber) {
  if (featuredSlots.has(slotNumber)) return 'featured';
  if (premiumSlots.has(slotNumber)) return 'premium';
  return 'basic';
}

function getSlotBadgeText(type) {
  if (type === 'featured') return '특별';
  if (type === 'premium') return '유료';
  return '';
}

function createSlotCard(slotNumber) {
  const type = getSlotType(slotNumber);
  const pet = registeredPets[slotNumber];
  const card = document.createElement('div');

  card.className = `slot-card ${type}`;
  if (pet) card.classList.add('has-image');

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
    card.addEventListener('click', () => openImageModal(pet));
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
  imageModal.classList.remove('hidden');
  imageModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeImageModal() {
  imageModal.classList.add('hidden');
  imageModal.setAttribute('aria-hidden', 'true');
  modalImage.src = '';
  document.body.style.overflow = 'hidden';
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

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !imageModal.classList.contains('hidden')) {
    closeImageModal();
  }
});

window.addEventListener('resize', applyGridLayout);

renderSlots();
applyGridLayout();