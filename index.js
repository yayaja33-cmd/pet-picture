import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { registeredPets } from './data.js';

const POPULAR_LIMIT = 5;
const VIEW_REFRESH_MS = 10000;
const popularSlots = document.getElementById('popularSlots');

const SUPABASE_URL = 'https://gvcmbuvtetttwqudkagi.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y21idXZ0ZXR0dHdxdWRrYWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg4NjcsImV4cCI6MjA5MTQ4NDg2N30.ZDmZTxJ_ej5Dqzg5P0ppt9j9Ca8YuuMjFeIyolcohK4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatViews(views) {
  return `조회수 ${Number(views || 0).toLocaleString('ko-KR')}`;
}

function createPopularCard({ rank, slotNumber, pet, views }) {
  const link = document.createElement('a');
  link.className = 'popular-slot';
  link.href = 'petboard.html';
  link.setAttribute('role', 'listitem');

  const thumb = document.createElement('div');
  thumb.className = 'popular-slot__thumb';

  const image = document.createElement('img');
  image.className = 'popular-slot__image';
  image.src = pet.image;
  image.alt = `${pet.name} 사진`;
  image.loading = 'lazy';
  image.decoding = 'async';

  const rankBadge = document.createElement('span');
  rankBadge.className = 'popular-slot__rank';
  rankBadge.textContent = String(rank);

  thumb.appendChild(image);
  thumb.appendChild(rankBadge);

  const title = document.createElement('strong');
  title.textContent = `#${slotNumber} ${pet.name}`;

  const meta = document.createElement('span');
  meta.className = 'popular-slot__meta';
  meta.textContent = formatViews(views);

  link.appendChild(thumb);
  link.appendChild(title);
  link.appendChild(meta);

  return link;
}

function createPlaceholderCard(rank) {
  const card = document.createElement('div');
  card.className = 'popular-slot popular-slot--empty';
  card.setAttribute('role', 'listitem');

  const thumb = document.createElement('div');
  thumb.className = 'popular-slot__thumb';

  const rankBadge = document.createElement('span');
  rankBadge.className = 'popular-slot__rank';
  rankBadge.textContent = String(rank);

  const emptyText = document.createElement('span');
  emptyText.className = 'popular-slot__empty-text';
  emptyText.textContent = '대기 슬롯';

  thumb.appendChild(rankBadge);
  thumb.appendChild(emptyText);

  const title = document.createElement('strong');
  title.textContent = `${rank}위 슬롯 준비 중`;

  const meta = document.createElement('span');
  meta.className = 'popular-slot__meta';
  meta.textContent = '등록 데이터가 추가되면 자동 반영됩니다';

  card.appendChild(thumb);
  card.appendChild(title);
  card.appendChild(meta);

  return card;
}

function renderPopularSlots(items) {
  if (!popularSlots) return;

  popularSlots.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'popular-loading';
    empty.textContent = '표시할 인기 슬롯 데이터가 없습니다.';
    popularSlots.appendChild(empty);
    return;
  }

  items.forEach((item, index) => {
    popularSlots.appendChild(
      createPopularCard({
        rank: index + 1,
        slotNumber: item.slotNumber,
        pet: item.pet,
        views: item.views
      })
    );
  });

  for (let rank = items.length + 1; rank <= POPULAR_LIMIT; rank += 1) {
    popularSlots.appendChild(createPlaceholderCard(rank));
  }
}

async function fetchViewMap(slotNumbers) {
  const { data, error } = await supabase
    .from('pet_views')
    .select('slot_number, views')
    .in('slot_number', slotNumbers);

  if (error) {
    console.error('인기 슬롯 조회수 로딩 실패:', error.message);
    return new Map();
  }

  return new Map(
    (data ?? []).map((row) => [Number(row.slot_number), Number(row.views) || 0])
  );
}

async function loadPopularSlots() {
  try {
    const petEntries = Object.entries(registeredPets).map(([slot, pet]) => ({
      slotNumber: Number(slot),
      pet
    }));

    if (petEntries.length === 0) {
      renderPopularSlots([]);
      return;
    }

    const slotNumbers = petEntries.map(({ slotNumber }) => slotNumber);
    const viewMap = await fetchViewMap(slotNumbers);

    const sorted = petEntries
      .map(({ slotNumber, pet }) => ({
        slotNumber,
        pet,
        views: viewMap.get(slotNumber) ?? (Number(pet.views) || 0)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, POPULAR_LIMIT);

    renderPopularSlots(sorted);
  } catch (error) {
    console.error('인기 슬롯 렌더링 실패:', error);
    if (popularSlots) {
      popularSlots.innerHTML = '<p class="popular-loading">인기 슬롯을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
    }
  }
}

void loadPopularSlots();
window.setInterval(() => {
  void loadPopularSlots();
}, VIEW_REFRESH_MS);
