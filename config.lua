Config = {}

Config.ItemName = 'worklight'
Config.ControllerItem = 'lightcontrol' -- Item that lets you control your placed lights remotely
Config.ControllerRange = 150.0 -- Max distance (metres) from you to a light for the controller to reach it

-- Tablet prop + animation while the controller UI is open
Config.ControllerTablet = {
    enabled = true,
    model = `prop_cs_tablet`,
    bone = 60309, -- right hand (PH_R_Hand)
    pos = vector3(0.03, 0.002, -0.0),
    rot = vector3(10.0, 160.0, 0.0),
    animDict = 'amb@code_human_in_bus_passenger_idles@female@tablet@base',
    animName = 'base'
}
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

-- Multiplier applied to light intensity in full daylight (8:00-18:00, eased in/out at dawn/dusk).
-- Set to 1.0 to disable. Raise it if lights still look weak in the day.
Config.DaylightBoost = 8.0

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
    model = `CSB_Celeb_01`,
    coords = vector4(220.13, -1516.01, 29.29, 223.56),
    spawnDistance = 60.0 -- NPC only exists on your client while you're this close
}

Config.RenderDistance = 80.0

Config.ShopItems = {
    ['worklight'] = { price = 500 },
    ['tubeworklight'] = { price = 750 },
    ['lightcontrol'] = { price = 1000 }
}

Config.ItemModels = {
    ['worklight'] = `prop_kino_light_02`,
    ['tubeworklight'] = `xm_prop_base_tripod_lampa`
}

-- =============================================
-- ADMIN COMMANDS
-- =============================================
-- /clearlights                     : Instantly deletes all placed studio lights on the server.
-- /clearblur                       : Fixes your screen if the blur effect gets stuck.