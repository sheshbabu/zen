function create(layer, item, x, y, onDragEnd, onClick) {
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
  const thumbnailWidth = 376;
  const thumbnailHeight = thumbnailWidth / item.aspectRatio;

  const group = new window.Konva.Group({
    x: image.x,
    y: image.y,
    draggable: true,
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

  if (onDragEnd) {
    group.on('dragend', () => {
      onDragEnd();
    });
  }

  group.setSelected = (selected) => {
    isSelected = selected;
    selectionBorder.visible(selected);
  };

  layer.add(group);
  return group;
}

export default { create };
