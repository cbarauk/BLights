# BLights

A studio lighting script for FiveM (QBCore). Players can buy portable photography lights, place them in the world, and control colour, brightness and range through a custom UI.

## Features

- Placeable studio lights with live placement preview
- Two light types: Studio Light (directional) and Omni Tube Light (360 degrees)
- Per-light control panel for colour, brightness, distance and width
- Lighting Controller tablet to adjust all of your placed lights from a distance
- Shop NPC with a custom NUI storefront
- Target interactions to control, move, rotate and pick up lights
- Lights are synced to all players and owned by the player who placed them
- Unused lights are removed automatically after a timeout

## Requirements

- qb-core
- qb-target or ox_target (set in `Config.Target`)
- qb-menu (set in `Config.Menu`)
- qb-inventory (or a compatible inventory for the item images)

## Installation

1. Place the script in your resources folder as `BLights`.
2. Add the items from `items.lua` to your `qb-core/shared/items.lua`.
3. Copy the images from `[qb]/qb-inventory/html/images/` into your inventory's images folder.
4. Add `ensure BLights` to your `server.cfg`.
5. Restart the server.

## Items

| Item | Label | Purpose |
|---|---|---|
| `worklight` | Studio Light | Place a directional studio light |
| `tubeworklight` | Omni Tube Light | Place a 360 degree omni light |
| `lightcontrol` | Lighting Controller | Opens the lighting tablet |

## Commands

| Command | Description |
|---|---|
| `/lighttablet` | Opens the lighting tablet. No item required. |

The `lightcontrol` item opens the same tablet.

## Usage

1. Buy lights from the shop NPC or receive them through your inventory.
2. Use a light item to start placement.
3. Place it with the confirm key, rotate with the arrow keys, adjust distance with the mouse wheel, and cancel with the cancel key.
4. Target a placed light to open its controls, move it, rotate it or pick it up.
5. Open the tablet with `/lighttablet` or the Lighting Controller item to control any lights you own within range.

Default placement controls (changeable in `Config.Controls`):

| Action | Key |
|---|---|
| Confirm | E |
| Cancel | Backspace |
| Rotate | Left and Right arrows |
| Adjust distance | Mouse wheel |

## Configuration

All settings are in `config.lua`, including:

- `Config.ControllerRange` - how far away the tablet can reach your lights
- `Config.Timeout` - seconds before an untouched light is removed
- `Config.RenderDistance` - distance at which lights are rendered
- `Config.DaylightBoost` - brightness multiplier during the day
- `Config.MinBrightness` and `Config.MaxBrightness` - brightness limits
- `Config.LightDefaults` - default light properties
- `Config.ShopNpc` - shop NPC model and location
- `Config.ShopItems` - items and prices sold in the shop
- `Config.ItemModels` - prop model used for each light item
- `Config.ShopBlip` - map blip for the shop (`Enabled` toggles it, plus sprite, colour, scale, label)
- `Config.Target` and `Config.Menu` - target and menu resources

## Notes

- `photographers.json` is used for creator code and cut data. It contains live data, so remove or clear it before sharing the resource.
- If you trigger any old `cb-lighting:*` events from other scripts, rename them to `blights:*`.

## Credits

Created by CBaraUK.
