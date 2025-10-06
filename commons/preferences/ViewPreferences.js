const VIEW_PREFERENCE_PREFIX = 'view-preference';
const DEFAULT_VIEW = 'list';

function getPreference(focusId, tagId, isArchived, isDeleted) {
  try {
    const key = getKey(focusId, tagId, isArchived, isDeleted);
    if (key === null) {
      return DEFAULT_VIEW;
    }
    return localStorage.getItem(key) || DEFAULT_VIEW;
  } catch {
    return DEFAULT_VIEW;
  }
}

// view: "list" || "card" || "gallery"
function setPreference(view, focusId, tagId, isArchived, isDeleted) {
  try {
    const key = getKey(focusId, tagId, isArchived, isDeleted);
    if (key === null) {
      return;
    }
    localStorage.setItem(key, view);
  } catch {
  }
}

function getKey(focusId, tagId, isArchived, isDeleted) {
  if (isDeleted === true) {
    return null;
  }

  if (isArchived === true) {
    return `${VIEW_PREFERENCE_PREFIX}-archived`;
  }

  if (focusId) {
    return `${VIEW_PREFERENCE_PREFIX}-focus-${focusId}`;
  }

  if (tagId) {
    return `${VIEW_PREFERENCE_PREFIX}-tag-${tagId}`;
  }

  return `${VIEW_PREFERENCE_PREFIX}-all`;
}

export default {
  getPreference,
  setPreference
};
