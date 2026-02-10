/**
 * Generate default OG image for homepage
 * Output: static/og-image.png (1200x630)
 */

import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const OUTPUT_PATH = path.join(process.cwd(), 'static/og-image.png');

// Load a font for satori
async function loadFont(): Promise<ArrayBuffer> {
	const fontUrl =
		'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';
	const response = await fetch(fontUrl);
	return response.arrayBuffer();
}

async function generateDefaultOgImage(fontData: ArrayBuffer): Promise<Buffer> {
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
								fontSize: '72px',
								fontWeight: 700,
								color: '#00ff41',
								marginBottom: '24px',
								textShadow: '0 0 40px rgba(0, 255, 65, 0.5)'
							},
							children: '> gregory.sh'
						}
					},
					{
						type: 'div',
						props: {
							style: {
								fontSize: '32px',
								color: '#008f11',
								maxWidth: '800px',
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
			width: 1200,
			height: 630,
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
			value: 1200
		}
	});

	return resvg.render().asPng();
}

async function main() {
	console.log('Loading font...');
	const fontData = await loadFont();

	console.log('Generating default OG image...');
	const png = await generateDefaultOgImage(fontData);

	fs.writeFileSync(OUTPUT_PATH, png);
	console.log(`Written ${OUTPUT_PATH} (${(png.length / 1024).toFixed(1)} KB)`);
}

main().catch(console.error);
