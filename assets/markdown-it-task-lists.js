// WARN: Have updated the makeCheckbox function to use SVG icons instead of images

// Markdown-it plugin to render GitHub-style task lists; see
//
// https://github.com/blog/1375-task-lists-in-gfm-issues-pulls-comments
// https://github.com/blog/1825-task-lists-in-all-markdown-documents

var disableCheckboxes = true;
var useLabelWrapper = false;
var useLabelAfter = false;

module.exports = function(md, options) {
	if (options) {
		disableCheckboxes = !options.enabled;
		useLabelWrapper = !!options.label;
		useLabelAfter = !!options.labelAfter;
	}

	md.core.ruler.after('inline', 'github-task-lists', function(state) {
		var tokens = state.tokens;
		for (var i = 2; i < tokens.length; i++) {
			if (isTodoItem(tokens, i)) {
				todoify(tokens[i], state.Token);
				attrSet(tokens[i-2], 'class', 'task-list-item' + (!disableCheckboxes ? ' enabled' : ''));
				attrSet(tokens[parentToken(tokens, i-2)], 'class', 'task-list-container');
			}
		}
	});
};

function attrSet(token, name, value) {
	var index = token.attrIndex(name);
	var attr = [name, value];

	if (index < 0) {
		token.attrPush(attr);
	} else {
		token.attrs[index] = attr;
	}
}

function parentToken(tokens, index) {
	var targetLevel = tokens[index].level - 1;
	for (var i = index - 1; i >= 0; i--) {
		if (tokens[i].level === targetLevel) {
			if (tokens[i].type === 'list_item_open') {
				var ulOlLevel = tokens[i].level - 1;
				for (var j = i - 1; j >= 0; j--) {
					if ((tokens[j].type === 'bullet_list_open' || tokens[j].type === 'ordered_list_open') && tokens[j].level === ulOlLevel) {
						return j;
					}
				}
			}
			return i;
		}
	}
	return -1;
}

function isTodoItem(tokens, index) {
	return isInline(tokens[index]) &&
		isParagraph(tokens[index - 1]) &&
		isListItem(tokens[index - 2]) &&
		startsWithTodoMarkdown(tokens[index]);
}

function todoify(token, TokenConstructor) {
    var wrapperOpen = new TokenConstructor('html_inline', '', 0);
    wrapperOpen.content = '<div class="task-item-content">';
    wrapperOpen.block = true;

    var wrapperClose = new TokenConstructor('html_inline', '', 0);
    wrapperClose.content = '</div>';
    wrapperClose.block = true;

    var checkbox = makeCheckbox(token, TokenConstructor);

    var newChildren = [];

    if (token.children.length > 0 && token.children[0].type === 'text') {
        var firstTextToken = new TokenConstructor('text', '', 0);
        firstTextToken.content = token.children[0].content.slice(3);
        newChildren.push(firstTextToken);

        for (var i = 1; i < token.children.length; i++) {
            newChildren.push(token.children[i]);
        }
    } else {
        for (var i = 0; i < token.children.length; i++) {
            if (i === 0 && token.children[i].type === 'text') {
                var firstTextToken = new TokenConstructor('text', '', 0);
                firstTextToken.content = token.children[i].content.slice(3);
                newChildren.push(firstTextToken);
            } else {
                newChildren.push(token.children[i]);
            }
        }
    }

    token.children = [];
    token.children.push(wrapperOpen);
    token.children.push(checkbox);

    for (var i = 0; i < newChildren.length; i++) {
        token.children.push(newChildren[i]);
    }

    token.children.push(wrapperClose);

    token.content = token.content.slice(3);

    if (useLabelWrapper) {
        if (useLabelAfter) {
            console.warn("`useLabelWrapper` with `useLabelAfter` might need re-evaluation with the new HTML structure.");
        } else {
            token.children.unshift(beginLabel(TokenConstructor));
            token.children.push(endLabel(TokenConstructor));
        }
    }
}

function makeCheckbox(token, TokenConstructor) {
	var checkbox = new TokenConstructor('html_inline', '', 0);
	if (token.content.indexOf('[ ] ') === 0) {
		checkbox.content = '<svg class="task-list-item-checkbox unchecked" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
			'<circle cx="12" cy="12" r="10" />' +
			'</svg>';
	} else if (token.content.indexOf('[x] ') === 0 || token.content.indexOf('[X] ') === 0) {
		checkbox.content = '<svg class="task-list-item-checkbox checked" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
			'<circle cx="12" cy="12" r="10" />' +
			'<path d="m9 12 2 2 4-4" />' +
			'</svg>';
	}
	return checkbox;
}

// these next two functions are kind of hacky; probably should really be a
// true block-level token with .tag=='label'
function beginLabel(TokenConstructor) {
	var token = new TokenConstructor('html_inline', '', 0);
	token.content = '<label>';
	return token;
}

function endLabel(TokenConstructor) {
	var token = new TokenConstructor('html_inline', '', 0);
	token.content = '</label>';
	return token;
}

function afterLabel(content, id, TokenConstructor) {
	var token = new TokenConstructor('html_inline', '', 0);
	token.content = '<label class="task-list-item-label" for="' + id + '">' + content + '</label>';
	token.attrs = [{for: id}];
	return token;
}

function isInline(token) { return token.type === 'inline'; }
function isParagraph(token) { return token.type === 'paragraph_open'; }
function isListItem(token) { return token.type === 'list_item_open'; }

function startsWithTodoMarkdown(token) {
	// leading whitespace in a list item is already trimmed off by markdown-it
	return token.content.indexOf('[ ] ') === 0 || token.content.indexOf('[x] ') === 0 || token.content.indexOf('[X] ') === 0;
}