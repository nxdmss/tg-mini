from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from shapely.geometry import Polygon
from shapely.geometry.polygon import orient
root = Path(__file__).resolve().parents[1]
f = TTFont(root / 'frontend/public/fonts/IZLOM_Narrow-Regular.ttf')
for char in '0123456789':
    name = f.getBestCmap()[ord(char)]
    recording = RecordingPen()
    f.getGlyphSet()[name].draw(recording)
    contours = []
    for op, points in recording.value:
        if op == 'moveTo': contour = [points[0]]
        elif op == 'lineTo': contour.extend(points)
        elif op == 'closePath': contours.append(contour)
        else: raise ValueError(f'Unexpected curve: {op}')
    shape = Polygon(contours[0], contours[1:])
    assert shape.is_valid
    bold = shape.buffer(17.5, join_style=2)
    assert bold.is_valid and bold.geom_type == 'Polygon'
    assert len(bold.interiors) == len(shape.interiors), 'Counter closed'
    bold = orient(bold, sign=-1)
    pen = TTGlyphPen(None)
    for ring in [bold.exterior, *bold.interiors]:
        pts = [(round(x), round(y)) for x, y in list(ring.coords)[:-1]]
        pen.moveTo(pts[0])
        for point in pts[1:]: pen.lineTo(point)
        pen.closePath()
    f['glyf'][name] = pen.glyph()
    advance, _ = f['hmtx'][name]
    f['hmtx'][name] = (advance, round(bold.bounds[0]))
    assert bold.bounds[0] >= 0 and bold.bounds[2] < advance
for rec in f['name'].names:
    if rec.nameID in (1, 2, 4, 6):
        value = {1:'IZLOM Narrow Readable',2:'Regular',4:'IZLOM Narrow Readable',6:'IZLOMNarrow-Readable'}[rec.nameID]
        rec.string = value.encode(rec.getEncoding())
f.flavor=None
f.save(root / 'frontend/public/fonts/IZLOM_Narrow-Readable.ttf')
print('10 digits thickened; counters and fixed advances preserved')
