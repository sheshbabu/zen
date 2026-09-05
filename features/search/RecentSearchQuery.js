const TTL_MS = 5 * 60 * 1000;

let query = "";
let savedAt = 0;

function get() {
  if (Date.now() - savedAt > TTL_MS) {
    return "";
  }
  return query;
}

function set(nextQuery) {
  query = nextQuery;
  savedAt = Date.now();
}

export default {
  get,
  set
};
