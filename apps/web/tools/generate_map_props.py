# Headless Blender prop generator for SPLOTCH map-expansion.
# Matches the existing kit's conventions:
#   - single mesh per GLB, low-poly, FLAT-shaded
#   - origin at the BASE (base sits on the floor at y=0), centered on XZ
#   - exact game-unit sizes (W x H x D) matching each PropDef.size
#   - a solid material whose base color ~= the prop's camo color
#
# Usage: blender --background --python generate_props.py -- <out_dir>
import bpy, sys, os, math

argv = sys.argv
out_dir = argv[argv.index("--") + 1] if "--" in argv else "."
os.makedirs(out_dir, exist_ok=True)


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def make_mat(name, hexcol):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    r, g, b = (srgb_to_linear(c) for c in hex_rgb(hexcol))
    bsdf.inputs["Base Color"].default_value = (r, g, b, 1.0)
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = 0.75
    return mat


def finalize(obj, mat):
    # flat shading (low-poly look)
    for p in obj.data.polygons:
        p.use_smooth = False
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def export(name):
    bpy.ops.object.select_all(action="DESELECT")
    obj = bpy.context.view_layer.objects.active
    obj.select_set(True)
    # apply transforms so the GLB bakes size/position
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out_dir, name + ".glb"),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )


def box(name, w, h, d, color, bevel=0.0):
    clear()
    bpy.ops.mesh.primitive_cube_add(size=1)  # unit cube spans -0.5..0.5
    obj = bpy.context.view_layer.objects.active
    # Blender is Z-up (exporter converts to glTF Y-up): X=width, Y=depth, Z=height.
    obj.scale = (w, d, h)
    obj.location = (0, 0, h / 2)  # base at z=0
    if bevel > 0:
        m = obj.modifiers.new("bev", "BEVEL")
        m.width = bevel
        m.segments = 1
        bpy.ops.object.modifier_apply(modifier=m.name)
    finalize(obj, make_mat(name, color))
    export(name)


def ball(name, dia, color):
    clear()
    r = dia / 2
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r)
    obj = bpy.context.view_layer.objects.active
    obj.location = (0, 0, r)  # base at z=0
    finalize(obj, make_mat(name, color))
    export(name)


def cylinder(name, dia, h, color, verts=10):
    clear()
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=dia / 2, depth=h)
    obj = bpy.context.view_layer.objects.active
    obj.location = (0, 0, h / 2)
    finalize(obj, make_mat(name, color))
    export(name)


# --- Neon Alley kit -------------------------------------------------------
box("na_dumpster", 1.9, 1.2, 1.1, "#1f6f6f", bevel=0.06)   # teal skip
box("na_vending", 1.2, 2.4, 1.0, "#c81e7a", bevel=0.04)    # magenta machine
box("na_barrier", 1.6, 1.0, 0.5, "#ff7a17")                # orange traffic barrier
cylinder("na_drum", 1.2, 1.8, "#0fd4e6")                    # cyan oil drum

# --- Toy Box kit ----------------------------------------------------------
box("tb_block_red", 1.5, 1.5, 1.5, "#e23b3b", bevel=0.1)   # alphabet block
box("tb_block_blue", 1.5, 1.5, 1.5, "#2f6fd0", bevel=0.1)
ball("tb_ball", 1.5, "#ffd023")                             # beach ball
box("tb_domino", 0.8, 1.8, 0.4, "#b4f531")                 # tall lime block

# --- Backrooms kit --------------------------------------------------------
box("br_box", 1.4, 1.4, 1.4, "#c2a260", bevel=0.03)        # cardboard box
box("br_cabinet", 1.3, 2.0, 0.7, "#b8ad8a")               # filing cabinet
box("br_beam", 1.0, 5.0, 1.0, "#d8cfa8")                  # yellow support beam

print("SPLOTCH_PROPS_DONE")
