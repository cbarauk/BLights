local QBCore = exports['qb-core']:GetCoreObject()
local PlacedLights = {}
local OwnersLights = {}

QBCore.Commands.Add('lighttablet', 'Open your Lighting Controller tablet', {}, false, function(source, args)
    TriggerClientEvent('blights:client:UseController', source)
end)

RegisterNetEvent('blights:server:RequestSync', function()
    local src = source
    TriggerClientEvent('blights:client:SyncLights', src, PlacedLights)
end)

RegisterNetEvent('blights:server:SyncAllLights', function()
    TriggerClientEvent('blights:client:SyncLights', -1, PlacedLights)
end)

RegisterNetEvent('blights:server:SyncAllColors', function(color, brightness)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    local ownerCitizenId = Player.PlayerData.citizenid
    brightness = tonumber(brightness) or Config.LightDefaults.brightness
    brightness = math.max(Config.MinBrightness, math.min(Config.MaxBrightness, brightness))

    if not color or not color.r or not color.g or not color.b then return end

    if OwnersLights[ownerCitizenId] then
        for _, netId in ipairs(OwnersLights[ownerCitizenId]) do
            if PlacedLights[netId] then
                PlacedLights[netId].color = color
                PlacedLights[netId].brightness = brightness
                PlacedLights[netId].lastInteract = os.time()
                
                local ent = NetworkGetEntityFromNetworkId(netId)
                if DoesEntityExist(ent) then
                    Entity(ent).state:set('color', color, true)
                    Entity(ent).state:set('brightness', brightness, true)
                end
                BroadcastLightUpdate(netId)
            end
        end
    end
end)

local function BroadcastLightUpdate(netId, exceptSrc)
    local l = PlacedLights[netId]
    if not l then return end
    for _, playerId in ipairs(GetPlayers()) do
        local id = tonumber(playerId)
        if id ~= exceptSrc then
            TriggerClientEvent('blights:client:UpdateLight', id, netId, l.color, l.brightness, l.distance, l.width)
        end
    end
end

-- Live edits from the control panel: validated, stored and sent to every player
-- (including ones whose client has not streamed the light in yet)
RegisterNetEvent('blights:server:LiveUpdate', function(netId, color, brightness, distance, width)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    local l = PlacedLights[netId]
    if not l or l.owner ~= Player.PlayerData.citizenid then return end

    if type(color) == 'table' and color.r and color.g and color.b then
        l.color = {
            r = math.max(0, math.min(255, math.floor(color.r))),
            g = math.max(0, math.min(255, math.floor(color.g))),
            b = math.max(0, math.min(255, math.floor(color.b)))
        }
    end
    if tonumber(brightness) then
        l.brightness = math.max(Config.MinBrightness, math.min(Config.MaxBrightness, tonumber(brightness)))
    end
    if tonumber(distance) then l.distance = math.max(1.0, math.min(50.0, tonumber(distance))) end
    if tonumber(width) then l.width = math.max(1.0, math.min(50.0, tonumber(width))) end
    l.lastInteract = os.time()

    BroadcastLightUpdate(netId, src)
end)

RegisterNetEvent('blights:server:PlaceLight', function(coords, rot, color, enabled, oldNetId, brightness, distance, width, itemName)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    local ownerCitizenId = Player.PlayerData.citizenid
    itemName = itemName or 'worklight'
    
    if oldNetId and PlacedLights[oldNetId] then
        if PlacedLights[oldNetId].owner ~= ownerCitizenId then return end
        
        local oldEntity = NetworkGetEntityFromNetworkId(oldNetId)
        if DoesEntityExist(oldEntity) then
            DeleteEntity(oldEntity)
        end
        PlacedLights[oldNetId] = nil
        
        if OwnersLights[ownerCitizenId] then
            for i, netId in ipairs(OwnersLights[ownerCitizenId]) do
                if netId == oldNetId then
                    table.remove(OwnersLights[ownerCitizenId], i)
                    break
                end
            end
        end
        TriggerClientEvent('blights:client:RemoveLight', -1, oldNetId)
    else
        local item = Player.Functions.GetItemByName(itemName)
        if not item or item.amount < 1 then
            TriggerClientEvent('QBCore:Notify', src, "You don't have a "..itemName.."!", "error")
            return
        end
        Player.Functions.RemoveItem(itemName, 1)
        TriggerClientEvent('inventory:client:ItemBox', src, QBCore.Shared.Items[itemName], "remove")
    end

    local model = Config.ItemModels[itemName] or Config.ItemModels['worklight']
    local obj = CreateObjectNoOffset(model, coords.x, coords.y, coords.z, true, true, false)
    
    local timeout = 0
    while not DoesEntityExist(obj) do 
        Wait(10) 
        timeout = timeout + 1
        if timeout > 50 then return end
    end
    
    SetEntityRotation(obj, rot.x, rot.y, rot.z, 2, true)

    local netId = NetworkGetNetworkIdFromEntity(obj)
    
    PlacedLights[netId] = {
        coords = coords,
        rot = rot,
        color = color or Config.DefaultColor,
        enabled = enabled ~= nil and enabled or Config.DefaultEnabled,
        brightness = brightness or Config.LightDefaults.brightness,
        distance = distance or Config.LightDefaults.distance,
        width = width or Config.LightDefaults.width,
        owner = ownerCitizenId,
        itemType = itemName,
        lastInteract = os.time()
    }

    if not OwnersLights[ownerCitizenId] then OwnersLights[ownerCitizenId] = {} end
    table.insert(OwnersLights[ownerCitizenId], netId)

    local state = Entity(obj).state
    state:set('lightData', PlacedLights[netId], true)

    TriggerClientEvent('blights:client:SpawnLight', -1, netId, PlacedLights[netId].color, PlacedLights[netId].enabled, PlacedLights[netId].brightness, PlacedLights[netId].distance, PlacedLights[netId].width, ownerCitizenId, rot, itemName)
end)

RegisterNetEvent('blights:server:UpdateRotation', function(netId, rot)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    local ownerCitizenId = Player.PlayerData.citizenid
    if not PlacedLights[netId] or PlacedLights[netId].owner ~= ownerCitizenId then return end

    local entity = NetworkGetEntityFromNetworkId(netId)
    if DoesEntityExist(entity) then
        SetEntityRotation(entity, rot.x, rot.y, rot.z, 2, true)
        PlacedLights[netId].rot = rot
        PlacedLights[netId].lastInteract = os.time()
        
        Entity(entity).state:set('rot', rot, true)
    end
end)

RegisterNetEvent('blights:server:SaveLightSettings', function(netId, color, brightness, distance, width)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    local ownerCitizenId = Player.PlayerData.citizenid
    if not PlacedLights[netId] or PlacedLights[netId].owner ~= ownerCitizenId then return end
    
    if color and color.r and color.g and color.b then 
        PlacedLights[netId].color = color 
    end
    
    if brightness then 
        brightness = tonumber(brightness) or Config.LightDefaults.brightness
        PlacedLights[netId].brightness = math.max(Config.MinBrightness, math.min(Config.MaxBrightness, brightness))
    end
    
    if distance then 
        distance = tonumber(distance) or Config.LightDefaults.distance
        PlacedLights[netId].distance = math.max(1.0, math.min(50.0, distance))
    end
    
    if width then 
        width = tonumber(width) or Config.LightDefaults.width
        PlacedLights[netId].width = math.max(1.0, math.min(50.0, width))
    end

    PlacedLights[netId].lastInteract = os.time()
    
    local ent = NetworkGetEntityFromNetworkId(netId)
    if DoesEntityExist(ent) then
        local state = Entity(ent).state
        state:set('color', PlacedLights[netId].color, true)
        state:set('brightness', PlacedLights[netId].brightness, true)
        state:set('distance', PlacedLights[netId].distance, true)
        state:set('width', PlacedLights[netId].width, true)
    end
    BroadcastLightUpdate(netId)
end)

RegisterNetEvent('blights:server:PickUp', function(netId)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end
    
    local ownerCitizenId = Player.PlayerData.citizenid

    if PlacedLights[netId] and PlacedLights[netId].owner == ownerCitizenId then
        local entity = NetworkGetEntityFromNetworkId(netId)
        if DoesEntityExist(entity) then
            DeleteEntity(entity)
        end
        
        local itemType = PlacedLights[netId].itemType or 'worklight'
        PlacedLights[netId] = nil
        
        if OwnersLights[ownerCitizenId] then
            for i, nId in ipairs(OwnersLights[ownerCitizenId]) do
                if nId == netId then
                    table.remove(OwnersLights[ownerCitizenId], i)
                    break
                end
            end
        end

        TriggerClientEvent('blights:client:RemoveLight', -1, netId)
        TriggerClientEvent('blights:client:PlayAnim', src, 'pickup')
        
        Wait(500) 
        Player.Functions.AddItem(itemType, 1)
        TriggerClientEvent('inventory:client:ItemBox', src, QBCore.Shared.Items[itemType], "add")
    else
        TriggerClientEvent('QBCore:Notify', src, "You do not own this light!", "error")
    end
end)

RegisterNetEvent('blights:server:ProcessPurchase', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    local cart = data.cart
    local paymentType = data.paymentType

    if not cart or type(cart) ~= "table" then return end

    local totalPrice = 0
    local validCart = {}

    for item, cartData in pairs(cart) do
        local qty = tonumber(cartData.qty)
        if not qty or qty < 1 or qty > 100 then return end

        local itemData = Config.ShopItems[item]
        if itemData then
            totalPrice = totalPrice + (itemData.price * qty)
            validCart[item] = qty
        end
    end

    if totalPrice == 0 then
        TriggerClientEvent('QBCore:Notify', src, "Your cart is empty!", "error")
        return
    end

    paymentType = (paymentType == 'cash' or paymentType == 'bank') and paymentType or 'cash'
    local balance = Player.Functions.GetMoney(paymentType)

    if balance and balance >= totalPrice then
        Player.Functions.RemoveMoney(paymentType, totalPrice)
        
        for item, qty in pairs(validCart) do
            Player.Functions.AddItem(item, qty)
            TriggerClientEvent('inventory:client:ItemBox', src, QBCore.Shared.Items[item], "add")
        end
        
        TriggerClientEvent('QBCore:Notify', src, 'Purchase successful! ($'..totalPrice..')', 'success')
    else
        TriggerClientEvent('QBCore:Notify', src, 'You do not have enough funds! ($'..totalPrice..')', 'error')
    end
end)

for itemName, _ in pairs(Config.ItemModels) do
    QBCore.Functions.CreateUseableItem(itemName, function(source, item)
        local src = source
        TriggerClientEvent('blights:client:UseWorklight', src, itemName)
    end)
end

QBCore.Functions.CreateUseableItem(Config.ControllerItem or 'lightcontrol', function(source, item)
    TriggerClientEvent('blights:client:UseController', source)
end)

CreateThread(function()
    while true do
        Wait(60000)
        local currentTime = os.time()
        for netId, data in pairs(PlacedLights) do
            if data.lastInteract and (currentTime - data.lastInteract >= Config.Timeout) then
                local entity = NetworkGetEntityFromNetworkId(netId)
                if DoesEntityExist(entity) then
                    DeleteEntity(entity)
                end
                PlacedLights[netId] = nil
                
                if OwnersLights[data.owner] then
                    for i, nId in ipairs(OwnersLights[data.owner]) do
                        if nId == netId then
                            table.remove(OwnersLights[data.owner], i)
                            break
                        end
                    end
                end
                TriggerClientEvent('blights:client:RemoveLight', -1, netId)
            end
        end
    end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    
    
    for netId, _ in pairs(PlacedLights) do
        local entity = NetworkGetEntityFromNetworkId(netId)
        if DoesEntityExist(entity) then
            DeleteEntity(entity)
        end
    end
    PlacedLights = {}
    OwnersLights = {}
end)