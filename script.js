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

const featuredSlots = new Set([2, 3, 4, 5, 6]);
const premiumSlots = new Set([1, 365]);
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/*
  샘플 등록 데이터
  추후에는 서버/DB 데이터로 바꾸면 되고,
  image는 지금 임시 이미지 주소를 넣어둔 거라,
  실제 운영할 때는 업로드한 이미지 URL로 바꾸면 됩니다.
*/
const registeredPets = {
  176: {
    name: '콩지',
    desc: '롱다리 강아지',
    image: 'https://i.postimg.cc/G2xd4Xks/kongji(175).jpg',
    registeredAt: Date.now()
  }
};

function getSlotType(slotNumber) {
  if (featuredSlots.has(slotNumber)) return 'featured';
  if (premiumSlots.has(slotNumber)) return 'premium';
  return 'basic';
}

function isNewRegistration(pet) {
  return (
    pet &&
    pet.registeredAt &&
    Date.now() - new Date(pet.registeredAt).getTime() <= ONE_DAY_MS
  );
}

function getSlotBadgeText(type, pet) {
  if (isNewRegistration(pet)) return '신규';
  if (type === 'premium') return '유료';
  return '';
}

function createSlotCard(slotNumber) {
  const type = getSlotType(slotNumber);
  const pet = registeredPets[slotNumber];
  const card = document.createElement('div');

  card.className = `slot-card ${type}`;
  if (pet) {
    card.classList.add('has-image');
    if (isNewRegistration(pet)) {
      card.classList.add('new');
    }
  }

  const badgeText = getSlotBadgeText(type, pet);

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
