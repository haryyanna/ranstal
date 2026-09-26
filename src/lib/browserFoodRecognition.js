import { VERIFIED_FOODS } from '../../data/verifiedFoods';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
const MODEL_ID = 'Xenova/clip-vit-base-patch32';

let classifierPromise;

const getClassifier = () => {
  if (!classifierPromise) {
    classifierPromise = import(/* @vite-ignore */ MODEL_URL)
      .then(({ env, pipeline }) => {
        env.allowLocalModels = false;
        return pipeline('zero-shot-image-classification', MODEL_ID, { dtype: 'q4' });
      })
      .catch((error) => {
        classifierPromise = null;
        throw error;
      });
  }
  return classifierPromise;
};

const getFoodCandidates = () => {
  const candidatesByLabel = new Map();
  for (const food of VERIFIED_FOODS) {
    const terms = Array.isArray(food.terms) ? food.terms : [];
    const englishTerm = terms.find((term) => /[a-z]/i.test(term) && !/[\u0080-\uFFFF]/.test(term) && term.toLowerCase() !== food.name.toLowerCase());
    const label = englishTerm || food.name;
    if (!candidatesByLabel.has(label)) candidatesByLabel.set(label, food);
  }
  return candidatesByLabel;
};

export const recognizeFoodInBrowser = async (imageDataUrl) => {
  const candidates = getFoodCandidates();
  const imageBlob = await fetch(imageDataUrl).then((response) => response.blob());
  const classifier = await getClassifier();
  const predictions = await classifier(imageBlob, [...candidates.keys()]);
  const [best, runnerUp] = predictions || [];
  if (!best || best.score < 0.12 || (runnerUp && best.score - runnerUp.score < 0.02)) return null;

  const food = candidates.get(best.label);
  return food ? { food, score: best.score } : null;
};
