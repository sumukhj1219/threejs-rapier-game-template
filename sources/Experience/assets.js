export default [
    {
        name: 'base',
        data: {},
        items: [
            { name: 'gunModel', source: '/model/gun.glb', type: 'gltf' },
            { name: 'wallModel', source: '/model/wall.glb', type: 'gltf' },
            { name: 'droneModel', source: '/model/drone.glb', type: 'gltf' },

            { name: 'groundColor', source: '/pbr/tile/Tiles133D_4K-JPG_Color.jpg', type: 'texture' },
            { name: 'groundAO', source: '/pbr/tile/Tiles133D_4K-JPG_AmbientOcclusion.jpg', type: 'texture' },
            { name: 'groundDisplacement', source: '/pbr/tile/Tiles133D_4K-JPG_Displacement.jpg', type: 'texture' },
            { name: 'groundNormal', source: '/pbr/tile/Tiles133D_4K-JPG_NormalGL.jpg', type: 'texture' },
            { name: 'groundRoughness', source: '/pbr/tile/Tiles133D_4K-JPG_Roughness.jpg', type: 'texture' }
        ]
    }
]