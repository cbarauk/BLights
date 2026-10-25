fx_version 'cerulean'
game 'gta5'

author 'CBaraUK'
description 'BLights - Studio Lighting Script with NUI Support'
version '1.2.0'

shared_script 'config.lua'

client_script 'client.lua'

server_script 'server.lua'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'stream/blight_kino_light_01.ytyp'
}

data_file 'DLC_ITYP_REQUEST' 'stream/blight_kino_light_01.ytyp'

dependency 'qb-core'