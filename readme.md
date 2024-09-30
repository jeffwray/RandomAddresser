# Random Addresser

Random Addresser is a Chrome extension designed to collect random addresses by sampling homes listed for sale on Zillow. This extension provides a diverse and representative dataset of addresses, which can be used for various purposes such as data analysis, research, and more.

## Features

- **Automatic Address Capture**: Automatically captures addresses from Zillow listings as you browse.
- **Manual Capture**: Manually capture addresses at any time with a simple button click.
- **CSV Export**: Export the captured addresses to a CSV file for easy data analysis.
- **Clear Captured Addresses**: Clear the list of captured addresses with a single click.
- **Responsive UI**: User-friendly popup interface to view and manage captured addresses.

## Installation

1. Clone or download this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the directory where you downloaded/cloned this repository.
5. The extension should now appear in your list of installed extensions.

## Usage

1. Navigate to Zillow and start browsing listings.
2. The extension will automatically inject buttons into the Zillow interface.
3. Use the "Start Capture" button to begin capturing addresses.
4. Use the "Capture" button to manually capture addresses at any time.
5. Use the "End Capture" button to stop capturing and export the addresses to a CSV file.
6. Open the extension popup by clicking on the extension icon in the Chrome toolbar.
7. View the list of captured addresses, clear the list, or export the addresses to a CSV file from the popup interface.

For geocoding the captured addresses, you can use the [RandomAddresser-Geocoder](https://github.com/jeffwray/RandomAddresser-Geocoder) tool.

## License
(C) 2024 BIGDEALIO, LLC.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to use the Software for research and non-commercial purposes, subject to the following conditions:

1. The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
2. The Software shall not be used for commercial purposes without explicit permission from the authors.
3. The Software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the Software or the use or other dealings in the Software.