/**
 * Generate LinkedIn cover image matching site aesthetic
 * Output: static/linkedin-cover.png (1584x396)
 */

import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const OUTPUT_PATH = path.join(process.cwd(), 'static/linkedin-cover.png');

// Load a font for satori
async function loadFont(): Promise<ArrayBuffer> {
	const fontUrl =
		'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';
	const response = await fetch(fontUrl);
	return response.arrayBuffer();
}

async function generateLinkedInCover(fontData: ArrayBuffer): Promise<Buffer> {
	// Generate at 4x for maximum crispness (LinkedIn will downscale)
	const scale = 4;
	const width = 1584 * scale; // 6336px
	const height = 396 * scale; // 1584px

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					height: '100%',
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					background: '#0d0d0d',
					fontFamily: 'Inter'
				},
				children: [
					{
						type: 'div',
						props: {
							style: {
								fontSize: `${64 * scale}px`,
								fontWeight: 700,
								color: '#00ff41',
								marginBottom: `${16 * scale}px`,
								textShadow: `0 0 ${20 * scale}px rgba(0, 255, 65, 0.6), 0 0 ${60 * scale}px rgba(0, 255, 65, 0.3)`
							},
							children: '> gregory.sh'
						}
					},
					{
						type: 'div',
						props: {
							style: {
								fontSize: `${28 * scale}px`,
								color: '#008f11',
								maxWidth: `${1000 * scale}px`,
								textAlign: 'center',
								lineHeight: 1.4
							},
							children: 'Building Startups with AI Agents'
						}
					}
				]
			}
		},
		{
			width,
			height,
			fonts: [
				{
					name: 'Inter',
					data: fontData,
					weight: 400,
					style: 'normal'
				},
				{
					name: 'Inter',
					data: fontData,
					weight: 700,
					style: 'normal'
				}
			]
		}
	);

	const resvg = new Resvg(svg, {
		fitTo: {
			mode: 'width',
			value: width
		}
	});

	return resvg.render().asPng();
}

async function main() {
	console.log('Loading font...');
	const fontData = await loadFont();

	console.log('Generating LinkedIn cover image...');
	const png = await generateLinkedInCover(fontData);

	fs.writeFileSync(OUTPUT_PATH, png);
	console.log(`Written ${OUTPUT_PATH} (${(png.length / 1024).toFixed(1)} KB)`);
}

main().catch(console.error);
