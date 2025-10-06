function create(layer, item, x, y, onDragEnd, onClick, onDoubleClick, customWidth, customHeight) {
  const image = {
    id: `image-${item.filename}`,
    type: 'image',
    filename: item.filename,
    url: `/images/${item.filename}`,
    width: item.width || 300,
    height: item.height || 200,
    x,
    y,
  };
  const defaultWidth = 500;
  const defaultHeight = defaultWidth / item.aspectRatio;

  const thumbnailWidth = customWidth || defaultWidth;
  const thumbnailHeight = customHeight || defaultHeight;

  const group = new window.Konva.Group({
    x: image.x,
    y: image.y,
    draggable: true,
    width: thumbnailWidth,
    height: thumbnailHeight,
  });

  let isSelected = false;

  const imagePlaceholder = new window.Konva.Rect({
    x: 0,
    y: 0,
    width: thumbnailWidth,
    height: thumbnailHeight,
    fill: '#F5F5F5',
    cornerRadius: 4,
  });

  const selectionBorder = new window.Konva.Rect({
    x: -2,
    y: -2,
    width: thumbnailWidth + 4,
    height: thumbnailHeight + 4,
    stroke: '#FACC15',
    strokeWidth: 3,
    cornerRadius: 8,
    visible: false,
  });


  group.add(selectionBorder);
  group.add(imagePlaceholder);

  const imageObj = new Image();
  imageObj.onload = () => {
    const konvaImage = new window.Konva.Image({
      x: 0,
      y: 0,
      image: imageObj,
      width: thumbnailWidth,
      height: thumbnailHeight,
      cornerRadius: 4,
    });

    imagePlaceholder.destroy();
    group.add(konvaImage);
    layer.draw();
  };
  imageObj.src = image.url;

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

    const scale = Math.max(scaleX, scaleY);

    const newWidth = Math.max(200, thumbnailWidth * scale);
    const newHeight = newWidth / item.aspectRatio;

    group.scaleX(1);
    group.scaleY(1);

    group.width(newWidth);
    group.height(newHeight);

    selectionBorder.width(newWidth + 4);
    selectionBorder.height(newHeight + 4);

    const children = group.getChildren();
    children.forEach(child => {
      if (child.className === 'Image') {
        child.width(newWidth);
        child.height(newHeight);
      }
    });

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
