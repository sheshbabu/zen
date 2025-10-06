function create(layer, x, y, onPositionChange, onClick, onDoubleClick, width = 250, height = 250, text = '') {
  const group = new window.Konva.Group({
    x: x,
    y: y,
    width: width,
    height: height,
    draggable: true,
  });

  const bgColor = '#fef08a';
  const borderColor = '#facc15';

  const bg = new window.Konva.Rect({
    width: width,
    height: height,
    fill: bgColor,
    stroke: borderColor,
    strokeWidth: 2,
    cornerRadius: 4,
    shadowColor: 'black',
    shadowBlur: 10,
    shadowOpacity: 0.2,
    shadowOffset: { x: 2, y: 2 },
  });

  group.add(bg);

  const textNode = new window.Konva.Text({
    x: 12,
    y: 12,
    width: width - 24,
    height: height - 24,
    text: text,
    fontSize: 18,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fill: '#713f12',
    align: 'left',
    verticalAlign: 'top',
    wrap: 'word',
    lineHeight: 1.4,
  });

  group.add(textNode);

  let isSelected = false;
  const selectionRect = new window.Konva.Rect({
    width: width,
    height: height,
    stroke: '#3b82f6',
    strokeWidth: 2,
    dash: [5, 5],
    visible: false,
  });

  group.add(selectionRect);

  group.setSelected = function (selected) {
    isSelected = selected;
    selectionRect.visible(selected);
    layer.draw();
  };

  group.on('dragmove', () => {
    if (onPositionChange) {
      onPositionChange();
    }
  });

  group.on('click tap', (e) => {
    if (onClick) {
      onClick(group, e);
    }

    if (onDoubleClick) {
      onDoubleClick(group, textNode);
    }
  });

  group.on('transform', () => {
    const scaleX = group.scaleX();
    const scaleY = group.scaleY();

    const newWidth = group.width() * scaleX;
    const newHeight = group.height() * scaleY;

    group.scaleX(1);
    group.scaleY(1);
    group.width(newWidth);
    group.height(newHeight);

    bg.width(newWidth);
    bg.height(newHeight);

    textNode.width(newWidth - 24);
    textNode.height(newHeight - 24);

    selectionRect.width(newWidth);
    selectionRect.height(newHeight);

    if (onPositionChange) {
      onPositionChange();
    }
  });

  layer.add(group);
  return group;
}

function getText(group) {
  const textNode = group.findOne('Text');
  return textNode ? textNode.text() : '';
}

function setText(group, text) {
  const textNode = group.findOne('Text');
  if (textNode) {
    textNode.text(text);
  }
}

export default { create, getText, setText };
