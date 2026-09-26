import { VERIFIED_FOODS } from '../../data/verifiedFoods';

// MobileViT-XXS is a small ImageNet classifier (~21.5 MB) that is much faster
// to download than the previous zero-shot CLIP model (~190 MB).
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
const MODEL_ID = 'Xenova/mobilevit-xx-small';

let classifierPromise;

const getClassifier = () => {
  if (!classifierPromise) {
    classifierPromise = import(/* @vite-ignore */ MODEL_URL)
      .then(({ env, pipeline }) => {
        env.allowLocalModels = false;
        return pipeline('image-classification', MODEL_ID);
      })
      .catch((error) => {
        classifierPromise = null;
        throw error;
      });
  }
  return classifierPromise;
};

const normalize = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// MobileViT uses ImageNet class names (for example, "French loaf"), which do
// not always use the same wording as Ranstal's Indonesian food catalog.
const MODEL_LABEL_FOOD_IDS = new Map([
  ['loaf', 'roti-tawar'],
  ['french loaf', 'roti-tawar'],
  ['bread', 'roti-tawar'],
  ['white bread', 'roti-tawar'],
  ['sandwich bread', 'roti-tawar'],
  ['sourdough', 'roti-tawar'],
  ['bagel', 'roti-tawar'],
  ['brown bread', 'roti-gandum'],
  ['wholemeal bread', 'roti-gandum'],
  ['wheat bread', 'roti-gandum'],
  ['granny smith', 'apel'],
  ['banana', 'pisang-ambon']
]);

const findFoodForLabel = (label) => {
  // ImageNet labels can include comma-separated synonyms, e.g.
  // "French loaf, bread, breadstuff". Check the canonical label first.
  const normalizedLabels = [...new Set(String(label || '').split(',').map(normalize).filter(Boolean))];
  for (const normalizedLabel of normalizedLabels) {
    const catalogMatch = VERIFIED_FOODS.find((food) => {
      const terms = [food.name, ...(food.terms || []), ...(food.searchTerms || [])];
      return terms.some((term) => {
        const normalizedTerm = normalize(term);
        return normalizedTerm === normalizedLabel
          || normalizedTerm.startsWith(`${normalizedLabel} `)
          || normalizedLabel.startsWith(`${normalizedTerm} `);
      });
    });

    if (catalogMatch) return catalogMatch;
    const mappedFoodId = MODEL_LABEL_FOOD_IDS.get(normalizedLabel);
    if (mappedFoodId) return VERIFIED_FOODS.find((food) => food.id === mappedFoodId);
  }

  return undefined;
};

export const recognizeFoodInBrowser = async (imageDataUrl) => {
  const imageBlob = await fetch(imageDataUrl).then((response) => response.blob());
  const classifier = await getClassifier();
  const predictions = await classifier(imageBlob, { topk: 5 });

  // Choose the highest-ranked supported food class, not a generic object label.
  for (const prediction of predictions || []) {
    const food = findFoodForLabel(prediction.label);
    if (food && prediction.score >= 0.08) return { food, score: prediction.score };
  }

  return null;
};
