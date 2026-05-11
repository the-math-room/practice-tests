export function populatePracticeSetSelect(selectEl, practiceSets) {
  selectEl.innerHTML = practiceSets
    .map(practiceSet => {
      return `<option value="${practiceSet.id}">${practiceSet.title}</option>`;
    })
    .join("");
}

export function getProblemSlotsForPracticeSet(practiceSetId, practiceSets, problemTypes) {
  const selectedPracticeSet = practiceSets.find(practiceSet => {
    return practiceSet.id === practiceSetId;
  });

  if (!selectedPracticeSet) {
    throw new Error(`Unknown practice set: ${practiceSetId}`);
  }

  const slotDefinitions = getSlotDefinitionsFromPracticeSet(selectedPracticeSet);

  return slotDefinitions.map(slotDefinition => {
    const problemType = findProblemType(slotDefinition.problemTypeId, problemTypes);

    return {
      ...slotDefinition,
      problemType
    };
  });
}

function getSlotDefinitionsFromPracticeSet(practiceSet) {
  if (Array.isArray(practiceSet.problemTypeIds)) {
    return practiceSet.problemTypeIds.map(problemTypeId => {
      return {
        type: "problem",
        problemTypeId
      };
    });
  }

  if (!Array.isArray(practiceSet.sections)) {
    return [];
  }

  return practiceSet.sections.flatMap(section => {
    return section.items.flatMap(item => {
      return expandPracticeSetItem(item, section);
    });
  });
}

function expandPracticeSetItem(item, section) {
  const count = item.count ?? 1;

  if (item.type === "pool") {
    return expandPoolItem(item, section, count);
  }

  if (item.type === "problem" || item.problemTypeId) {
    return Array.from({ length: count }, () => {
      return {
        type: "problem",
        sectionTitle: section.title,
        problemTypeId: item.problemTypeId
      };
    });
  }

  throw new Error(`Unsupported practice set item type: ${item.type}`);
}

function expandPoolItem(pool, section, count) {
  if (!Array.isArray(pool.items) || pool.items.length === 0) {
    throw new Error(`Pool has no items: ${pool.title ?? "Untitled Pool"}`);
  }

  const selectedPoolItems = selectFromPool(pool, count);
  const poolProblemTypeIds = pool.items.map(item => item.problemTypeId);

  return selectedPoolItems.map(selectedItem => {
    return {
      type: "pool",
      sectionTitle: section.title,
      poolTitle: pool.title,
      poolProblemTypeIds,
      problemTypeId: selectedItem.problemTypeId
    };
  });
}

function selectFromPool(pool, count) {
  const allowRepeats = pool.allowRepeats ?? false;
  const selected = [];
  let availableItems = [...pool.items];

  for (let i = 0; i < count; i++) {
    if (availableItems.length === 0) {
      if (allowRepeats) {
        availableItems = [...pool.items];
      } else {
        break;
      }
    }

    const chosen = chooseWeightedItem(availableItems);
    selected.push(chosen);

    if (!allowRepeats) {
      availableItems = availableItems.filter(item => {
        return item.problemTypeId !== chosen.problemTypeId;
      });
    }
  }

  return selected;
}

function chooseWeightedItem(items) {
  const totalWeight = items.reduce((sum, item) => {
    return sum + (item.weight ?? 1);
  }, 0);

  let randomValue = Math.random() * totalWeight;

  for (const item of items) {
    randomValue -= item.weight ?? 1;

    if (randomValue <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function findProblemType(problemTypeId, problemTypes) {
  const problemType = problemTypes.find(type => {
    return type.id === problemTypeId;
  });

  if (!problemType) {
    throw new Error(`Problem type not found: ${problemTypeId}`);
  }

  return problemType;
}