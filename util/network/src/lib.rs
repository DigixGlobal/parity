// Copyright 2015, 2016 Ethcore (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

//! Network and general IO module.
//!
//! Example usage for craeting a network service and adding an IO handler:
//!
//! ```rust
//! extern crate ethcore_network as net;
//! use net::*;
//! use std::sync::Arc;
//!
//! struct MyHandler;
//!
//! impl NetworkProtocolHandler for MyHandler {
//!		fn initialize(&self, io: &NetworkContext) {
//!			io.register_timer(0, 1000);
//!		}
//!
//!		fn read(&self, io: &NetworkContext, peer: &PeerId, packet_id: u8, data: &[u8]) {
//!			println!("Received {} ({} bytes) from {}", packet_id, data.len(), peer);
//!		}
//!
//!		fn connected(&self, io: &NetworkContext, peer: &PeerId) {
//!			println!("Connected {}", peer);
//!		}
//!
//!		fn disconnected(&self, io: &NetworkContext, peer: &PeerId) {
//!			println!("Disconnected {}", peer);
//!		}
//! }
//!
//! fn main () {
//! 	let mut service = NetworkService::new(NetworkConfiguration::new_local()).expect("Error creating network service");
//! 	service.register_protocol(Arc::new(MyHandler), *b"myp", &[1u8]);
//! 	service.start().expect("Error starting service");
//!
//! 	// Wait for quit condition
//! 	// ...
//! 	// Drop the service
//! }
//! ```

extern crate ethcore_io as io;
extern crate ethcore_util as util;
extern crate parking_lot;
extern crate mio;
extern crate tiny_keccak;
extern crate crypto as rcrypto;
extern crate rand;
extern crate time;
extern crate ansi_term; //TODO: remove this
extern crate rustc_serialize;
extern crate igd;
extern crate libc;
extern crate slab;
extern crate ethkey;
extern crate ethcrypto as crypto;
extern crate rlp;

#[macro_use]
extern crate log;

#[cfg(test)]
extern crate ethcore_devtools as devtools;

mod host;
mod connection;
mod handshake;
mod session;
mod discovery;
mod service;
mod error;
mod node_table;
mod stats;
mod ip_utils;

#[cfg(test)]
mod tests;

pub use host::PeerId;
pub use host::PacketId;
pub use host::NetworkContext;
pub use service::NetworkService;
pub use host::NetworkIoMessage;
pub use error::NetworkError;
pub use host::NetworkConfiguration;
pub use stats::NetworkStats;

use io::TimerToken;
pub use node_table::is_valid_node_url;

const PROTOCOL_VERSION: u32 = 4;

/// Network IO protocol handler. This needs to be implemented for each new subprotocol.
/// All the handler function are called from within IO event loop.
/// `Message` is the type for message data.
pub trait NetworkProtocolHandler: Sync + Send {
	/// Initialize the handler
	fn initialize(&self, _io: &NetworkContext) {}
	/// Called when new network packet received.
	fn read(&self, io: &NetworkContext, peer: &PeerId, packet_id: u8, data: &[u8]);
	/// Called when new peer is connected. Only called when peer supports the same protocol.
	fn connected(&self, io: &NetworkContext, peer: &PeerId);
	/// Called when a previously connected peer disconnects.
	fn disconnected(&self, io: &NetworkContext, peer: &PeerId);
	/// Timer function called after a timeout created with `NetworkContext::timeout`.
	fn timeout(&self, _io: &NetworkContext, _timer: TimerToken) {}
}

/// Non-reserved peer modes.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum NonReservedPeerMode {
	/// Accept them. This is the default.
	Accept,
	/// Deny them.
	Deny,
}

impl NonReservedPeerMode {
	/// Attempt to parse the peer mode from a string.
	pub fn parse(s: &str) -> Option<Self> {
		match s {
			"accept" => Some(NonReservedPeerMode::Accept),
			"deny" => Some(NonReservedPeerMode::Deny),
			_ => None,
		}
	}
}
