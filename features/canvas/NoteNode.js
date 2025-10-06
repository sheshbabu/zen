function create(layer, item, x, y, onDragEnd, onClick, onDoubleClick, customWidth, customHeight) {
  const note = {
    id: `note-${item.noteId}`,
    type: 'note',
    title: item.title || item.name || '',
    text: item.content || item.matchText || item.snippet || '',
    tags: item.tags || [],
    x,
    y,
  };
  const defaultWidth = 500;
  const defaultHeight = note.title && note.title.length > 0 ? 360 : 340;

  const nodeWidth = customWidth || defaultWidth;
  const cardHeight = customHeight || defaultHeight;
  const padding = 16;
  const headerHeight = 28;
  const tagsHeight = 24;

  const group = new window.Konva.Group({
    x: note.x,
    y: note.y,
    draggable: true,
    width: nodeWidth,
    height: cardHeight,
  });

  const background = new window.Konva.Rect({
    width: nodeWidth,
    height: cardHeight,
    fill: '#FFFFFF',
    stroke: '#E5E5E5',
    strokeWidth: 1,
    cornerRadius: 8,
    shadowColor: '#000000',
    shadowBlur: 4,
    shadowOffset: { x: 0, y: 2 },
    shadowOpacity: 0.1,
  });

  const selectionBorder = new window.Konva.Rect({
    x: -2,
    y: -2,
    width: nodeWidth + 4,
    height: cardHeight + 4,
    stroke: '#FACC15',
    strokeWidth: 3,
    cornerRadius: 8,
    visible: false,
  });

  let isSelected = false;


  let title = null;
  let tags = null;
  let textYPosition = padding;

  if (note.title && note.title.length > 0) {
    title = new window.Konva.Text({
      x: padding + 4,
      y: padding,
      text: note.title,
      fontSize: 20,
      fontStyle: 'bold',
      fill: '#404040',
      width: nodeWidth - (padding * 2) - 4,
      ellipsis: true,
    });
    textYPosition = padding + headerHeight;
  }

  if (note.tags && note.tags.length > 0) {
    const tagsText = note.tags.map(tag => `#${tag}`).join(' ');
    tags = new window.Konva.Text({
      x: padding + 4,
      y: textYPosition,
      text: tagsText,
      fontSize: 14,
      fill: '#A3A3A3',
      width: nodeWidth - (padding * 2) - 4,
    });
    textYPosition += tagsHeight + 8;
  }

  const availableHeight = cardHeight - textYPosition - padding;

  const textContent = new window.Konva.Text({
    x: padding + 4,
    y: textYPosition,
    text: note.text,
    fontSize: 18,
    fill: '#525252',
    width: nodeWidth - (padding * 2) - 4,
    height: availableHeight,
    lineHeight: 1.4,
  });


  group.add(selectionBorder);
  group.add(background);
  if (title) {
    group.add(title);
  }
  if (tags) {
    group.add(tags);
  }
  group.add(textContent);

  group.on('mouseenter', () => {
    if (isSelected !== true) {
      background.stroke('#A3A3A3');
      background.strokeWidth(2);
      layer.draw();
    }
  });

  group.on('mouseleave', () => {
    if (isSelected !== true) {
      background.stroke('#E5E5E5');
      background.strokeWidth(1);
      layer.draw();
    }
  });

  group.on('click', (e) => {
    if (onClick) {
      onClick(group, e);
    }
  });

  group.on('dblclick', () => {
    if (onDoubleClick) {
      onDoubleClick(item);
    }
  });

  if (onDragEnd) {
    group.on('dragend', () => {
      onDragEnd();
    });
  }

  group.on('transformend', (e) => {
    const scaleX = group.scaleX();
    const scaleY = group.scaleY();

    const newWidth = Math.max(300, background.width() * scaleX);
    const newHeight = Math.max(200, background.height() * scaleY);

    group.scaleX(1);
    group.scaleY(1);

    group.width(newWidth);
    group.height(newHeight);

    background.width(newWidth);
    background.height(newHeight);

    selectionBorder.width(newWidth + 4);
    selectionBorder.height(newHeight + 4);

    const textWidth = newWidth - (padding * 2) - 4;
    if (title) {
      title.width(textWidth);
    }
    if (tags) {
      tags.width(textWidth);
    }
    textContent.width(textWidth);

    const availableHeight = newHeight - textYPosition - padding;
    textContent.height(availableHeight);

    if (e.currentTarget.getLayer()) {
      const transformer = e.currentTarget.getLayer().findOne('Transformer');
      if (transformer) {
        transformer.forceUpdate();
      }
    }

    layer.draw();

    if (onDragEnd) {
      setTimeout(() => onDragEnd(), 0);
    }
  });

  group.setSelected = (selected) => {
    isSelected = selected;
    selectionBorder.visible(selected);
  };

  layer.add(group);
  return group;
}

export default { create };
