export default [
    {
        name: 'base',
        data: {},
        items: [
            // 3D GLTF Models (Switched from /model/ to ./model/)
            { name: 'gunModel', source: './model/gun.glb', type: 'gltf' },
            { name: 'wallModel', source: './model/wall.glb', type: 'gltf' },
            { name: 'droneModel', source: './model/drone.glb', type: 'gltf' },
            { name: 'tentModel', source: './model/tent.glb', type: 'gltf' },

            // Ground Textures (Switched from /pbr/ to ./pbr/)
            { name: 'groundColor', source: './pbr/tile/Tiles133D_4K-JPG_Color.jpg', type: 'texture' },
            { name: 'groundAO', source: './pbr/tile/Tiles133D_4K-JPG_AmbientOcclusion.jpg', type: 'texture' },
            { name: 'groundDisplacement', source: './pbr/tile/Tiles133D_4K-JPG_Displacement.jpg', type: 'texture' },
            { name: 'groundNormal', source: './pbr/tile/Tiles133D_4K-JPG_NormalGL.jpg', type: 'texture' },
            { name: 'groundRoughness', source: './pbr/tile/Tiles133D_4K-JPG_Roughness.jpg', type: 'texture' },

            // Tent Textures (Switched from /pbr/ to ./pbr/)
            { name: 'tentColor', source: './pbr/fabric/Fabric048_2K-JPG_Color.jpg', type: 'texture' },
            { name: 'tentAO', source: './pbr/fabric/Fabric048_2K-JPG_AmbientOcclusion.jpg', type: 'texture' },
            { name: 'tentDisplacement', source: './pbr/fabric/Fabric048_2K-JPG_Displacement.jpg', type: 'texture' },
            { name: 'tentNormal', source: './pbr/fabric/Fabric048_2K-JPG_NormalGL.jpg', type: 'texture' },
            { name: 'tentRoughness', source: './pbr/fabric/Fabric048_2K-JPG_Roughness.jpg', type: 'texture' },

            // Audio SFX Tracks (Switched from /sounds/ to ./sounds/)
            { name: 'shootSFX', source: './sounds/shoot.mp3', type: 'audio' },
            { name: 'blastSFX', source: './sounds/blast.mp3', type: 'audio' },
            { name: 'deadSFX', source: './sounds/dead.wav', type: 'audio' },
            { name: 'droneSFX', source: './sounds/drone.mp3', type: 'audio' },
            { name: 'portalSFX', source: './sounds/portal.mp3', type: 'audio' },
            { name: 'breatheSFX', source: './sounds/breathe.mp3', type: 'audio' },
        ]
    }
]