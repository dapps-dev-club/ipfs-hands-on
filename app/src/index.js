import Web3 from 'web3';

import profilesArtefact from "../../build/contracts/Profiles.json";

const ProfilesApp = {
  web3: undefined,
  accounts: undefined,
  contract: undefined,
};

window.addEventListener('load', function() {
  if (window.ethereum) {
    init();
  } else {
    // basically, politely telling the user to install a newer version of
    // metamask, or else fly 🪁
    console.error('No compatible web3 provider injected');
  }
});

async function init() {
  try {
    window.ProfilesApp = ProfilesApp; // DEBUG
    await window.ethereum.enable(); // get permission to access accounts
    ProfilesApp.web3 = new Web3(window.ethereum);

    // determine network to connect to
    let networkId = await ProfilesApp.web3.eth.net.getId();
    console.log('networkId', networkId);

    let deployedNetwork = profilesArtefact.networks[networkId];
    if (!deployedNetwork) {
      console.warn('web3 provider is connected to a network ID that does not matched the deployed network ID');
      console.warn('Pls make sure that you are connected to the right network, defaulting to deployed network ID');
      networkId = Object.keys(profilesArtefact.networks)[0];
      deployedNetwork = profilesArtefact.networks[networkId];
    }
    console.log('deployedNetwork', deployedNetwork);

    // initialise the contract
    ProfilesApp.contract = new ProfilesApp.web3.eth.Contract(
      profilesArtefact.abi,
      deployedNetwork.address,
    );


    // set the initial accounts
    updateAccounts(await ProfilesApp.web3.eth.getAccounts());

    console.log('ProfilesApp initialised');
  } catch (err) {
    console.error('Failed to init contract');
    console.error(err);
  }

  // set up listeners for app interactions.
  const queryProfileButton = document.querySelector('#queryProfileButton');
  queryProfileButton.addEventListener('click', queryProfile);

  const updateProfileButton = document.querySelector('#updateProfileButton');
  updateProfileButton.addEventListener('click', updateProfile);

  // trigger various things that need to happen upon app being opened.
  window.ethereum.on('accountsChanged', updateAccounts);
}

async function updateAccounts(accounts) {
  ProfilesApp.accounts = accounts;
  console.log('updateAccounts', accounts[0]);
}

async function queryProfile() {
  const addressInput = document.querySelector('#addressInput');
  const profileAddress = addressInput.value;
  console.log({ profileAddress });

  const ipfsHash = await ProfilesApp.contract.methods.profiles(profileAddress).call({
    from: ProfilesApp.accounts[0],
  });
  console.log({ ipfsHash });

  // TODO use the IPFS hash to read file
  // https://github.com/ipfs/interface-js-ipfs-core/blob/master/SPEC/FILES.md#cat

  // TODO display profile
}

async function updateProfile() {
  const profileInput = document.querySelector('#profileInput');
  let profile;
  try {
    profile = JSON.parse(profileInput.value);
  } catch (ex) {
    throw 'Failed to parse input profile';
  }
  console.log({ profile });

  // TODO write to IPFS and obtain its hash
  // ref: https://github.com/ipfs/interface-js-ipfs-core/blob/master/SPEC/FILES.md#add

  // TODO write IPFS hash instead of the full JSON file
  await ProfilesApp.contract.methods.updateProfile(
    JSON.stringify(profile),
  ).send({
    from: ProfilesApp.accounts[0],
  });
}
