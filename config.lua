Config = {}

Config.ItemName = 'worklight'
Config.Command = 'placelight' 
Config.Debug = false
Config.PlacementDistance = 3.0
Config.InteractionDistance = 1.5
Config.RotationSpeed = 2.0 

Config.Target = 'qb-target'
Config.Menu = 'qb-menu'

Config.DefaultColor = { r = 255, g = 255, b = 255 }
Config.DefaultEnabled = true
Config.MinBrightness = 0.5
Config.MaxBrightness = 10.0

Config.Controls = {
    Confirm = { key = 38, label = 'E' }, 
    Cancel = { key = 194, label = 'BACK' }, 
    RotateLeft = { key = 174, label = '←' },
    RotateRight = { key = 175, label = '→' },
    WheelUp = { key = 15, label = 'Wheel ↑' },
    WheelDown = { key = 14, label = 'Wheel ↓' }
}

Config.LightDefaults = {
    offset = vector3(0.0, 0.0, 0.0), 
    dirOffset = vector3(0.0, -1.0, 0.0),
    brightness = 8.0,
    distance = 25.0,
    roundness = 1.0,
    width = 25.0, 
    falloff = 10.0
}

Config.Timeout = 1800
Config.EnableNightTimeCommand = true 

Config.ShopNpc = {
    model = `ig_money`,
    coords = vector4(220.13, -1516.01, 29.29, 223.56)
}

Config.RenderDistance = 80.0

Config.ShopItems = {
    ['worklight'] = { price = 500 },
    ['tubeworklight'] = { price = 750 }
}

Config.ItemModels = {
    ['worklight'] = `prop_kino_light_02`,
    ['tubeworklight'] = `xm_prop_base_tripod_lampa`
}

-- =============================================
-- PHOTOGRAPHER CODE SYSTEM
-- If enabled, players must enter a code at the shop to buy lights.
-- Admins use /addphotographer [playerId] [code] to give a photographer their code.
-- Photographers get a 20% cut of all sales made with their code, collectible at the NPC.
-- =============================================
Config.RequirePhotographerCode = false -- Set to true to enable the code system
Config.PhotographerCut = 0.20 -- 20% of the total sale goes to the photographer

-- List of permanent photographer codes mapped to their CitizenID (Loaded on server restart)
-- Admins can also add them live in-game using /addphotographer [playerId] [code]
Config.Photographers = {
    -- ["STUDIO1"] = "ABCD1234", 
    -- ["PHOTO2"] = "EFGH5678",
    -- ["LIGHTS3"] = "IJKL9012"
}

-- =============================================
-- ADMIN COMMANDS
-- =============================================
-- /addphotographer [playerId] [code] : Gives a player a permanent photographer code.
-- /removephotographer [code]       : Removes a photographer code.
-- /clearlights                     : Instantly deletes all placed studio lights on the server.
-- /clearblur                       : Fixes your screen if the blur effect gets stuck.