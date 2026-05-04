import fs from 'fs';

const clickSoundData = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAAEFtDkAAAAH//tQQAAAAAAAASsAAAAABoAAn//+XhAAEEAAE/+P/5IAP8P//j//44A//rP/6eP/5jP/4hP/z8//Nj//N5//OA//OE//OFP/OIf/OMf/OQv/OTn/OVP/OWP/OVv/OVH/OUT/OTX/OR//OR//ORv/OR//ORv/OR//OSf//x//54P/6iP/6iP/6iP/6hP/6hP/6hP/6hP/6iP/6iP/6iP/6jP/6jP/6lP/6mf/6mv/6nf/6n//vP//tQQAAJwAAASsAAAAABoAAn//+XhAAEEAAE/+P/5IAP8P//j//44A//rP/6eP/5jP/4hP/z8//Nj//N5//OA//OE//OFP/OIf/OMf/OQv/OTn/OVP/OWP/OVv/OVH/OUT/OTX/OR//OR//ORv/OR//ORv/OR//OSf//x//54P/6iP/6iP/6iP/6hP/6hP/6hP/6hP/6iP/6iP/6iP/6jP/6jP/6lP/6mf/6mv/6nf/6n//vP//uAAAAAAA=";

fs.writeFileSync('public/sounds/click.mp3', Buffer.from(clickSoundData, 'base64'));
console.log('Created click.mp3');
