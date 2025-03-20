"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DocsPage() {
  useEffect(() => {
    // This is just to trigger any client-side code if needed
  }, []);

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black min-h-screen text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-purple-400">
          Quantum Drift Documentation
        </h1>

        <div className="mb-10">
          <Link
            href="/"
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-full text-white transition-colors"
          >
            Back to Game
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">
            Game Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-800 bg-opacity-50 p-6 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-purple-300">
                Spacecraft Controls
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                    W
                  </span>{" "}
                  or
                  <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                    ↑
                  </span>
                  Move Forward
                </li>
                <li className="flex items-center">
                  <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                    S
                  </span>{" "}
                  or
                  <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                    ↓
                  </span>
                  Move Backward
                </li>
                <li className="flex items-center">
                  <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                    A
                  </span>{" "}
                  or
                  <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                    ←
                  </span>
                  Move Left
                </li>
                <li className="flex items-center">
                  <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                    D
                  </span>{" "}
                  or
                  <span className="bg-gray-700 px-2 py-1 rounded mx-2 text-sm">
                    →
                  </span>
                  Move Right
                </li>
                <li className="flex items-center">
                  <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                    SPACE
                  </span>
                  Fire Laser Beams
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-purple-300">
                Quantum Realm Shifting
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                    1
                  </span>
                  Regular Space
                </li>
                <li className="flex items-center">
                  <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                    2
                  </span>
                  Low Gravity
                </li>
                <li className="flex items-center">
                  <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                    3
                  </span>
                  High Density
                </li>
                <li className="flex items-center">
                  <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-sm">
                    4
                  </span>
                  Probability
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">
            Game Features
          </h2>
          <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-2 text-purple-300">
              Quantum Realms
            </h3>
            <p className="mb-4">
              Each realm has unique physics properties that affect your
              spacecraft&apos;s movement and handling.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-900 bg-opacity-30 p-3 rounded">
                <h4 className="font-bold">Regular Space</h4>
                <p className="text-sm">
                  Standard physics with balanced movement and inertia.
                </p>
              </div>
              <div className="bg-cyan-900 bg-opacity-30 p-3 rounded">
                <h4 className="font-bold">Low Gravity</h4>
                <p className="text-sm">
                  Floaty movement with less drag and higher top speed.
                </p>
              </div>
              <div className="bg-purple-900 bg-opacity-30 p-3 rounded">
                <h4 className="font-bold">High Density</h4>
                <p className="text-sm">
                  Heavy resistance with higher drag and slower movement.
                </p>
              </div>
              <div className="bg-green-900 bg-opacity-30 p-3 rounded">
                <h4 className="font-bold">Probability</h4>
                <p className="text-sm">
                  Unpredictable movement with quantum randomness affecting
                  controls.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-purple-300">
              Combat System
            </h3>
            <p>
              Use your laser beams to destroy asteroids and other objects in the
              environment. Each destroyed object increases your score.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">
            Secret Easter Eggs
          </h2>
          <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
            <p className="italic text-gray-400 mb-6">
              The following secrets are hidden throughout the game. Can you
              discover them all?
            </p>

            <details className="mb-4">
              <summary className="cursor-pointer text-yellow-400 font-semibold py-2">
                Double Laser Power
              </summary>
              <div className="pl-4 pt-2 text-gray-300">
                <p>
                  Destroy multiple asteroids to increase your score. Once you
                  reach 1000 points, you&apos;ll unlock the double laser power-up,
                  allowing your ship to fire four beams at once instead of two,
                  with a faster firing rate.
                </p>
              </div>
            </details>

            <details className="mb-4">
              <summary className="cursor-pointer text-yellow-400 font-semibold py-2">
                Matrix Mode
              </summary>
              <div className="pl-4 pt-2 text-gray-300">
                <p>
                  Press the{" "}
                  <span className="bg-gray-700 px-2 py-1 rounded text-sm">
                    M
                  </span>{" "}
                  key during gameplay to activate &quot;Matrix Mode&quot;, transforming
                  the visual style of the entire game to a green wireframe
                  aesthetic reminiscent of the Matrix film. Press{" "}
                  <span className="bg-gray-700 px-2 py-1 rounded text-sm">
                    M
                  </span>{" "}
                  again to toggle it off.
                </p>
              </div>
            </details>

            <details className="mb-4">
              <summary className="cursor-pointer text-yellow-400 font-semibold py-2">
                Konami Code
              </summary>
              <div className="pl-4 pt-2 text-gray-300">
                <p>
                  The classic Konami Code works in Quantum Drift! Enter
                  <span className="bg-gray-700 px-2 py-1 rounded mx-1 text-sm">
                    ↑ ↑ ↓ ↓ ← → ← → B A
                  </span>
                  during gameplay to activate unlimited laser firing with no
                  cooldown. The lasers will also change color to red and have
                  increased power.
                </p>
              </div>
            </details>

            <details className="mb-4">
              <summary className="cursor-pointer text-yellow-400 font-semibold py-2">
                Ultimate Power: Time Dilation
              </summary>
              <div className="pl-4 pt-2 text-gray-300">
                <p>
                  This is the most challenging easter egg to discover. First,
                  you need to:
                </p>
                <ol className="list-decimal pl-6 space-y-2 mt-2">
                  <li>Activate the Konami Code</li>
                  <li>Toggle Matrix Mode</li>
                  <li>Earn the Double Laser upgrade</li>
                  <li>
                    Visit all four quantum realms in order: Regular, Low
                    Gravity, High Density, and finally Probability
                  </li>
                </ol>
                <p className="mt-2">
                  Once all conditions are met, a spectacular visual effect will
                  occur and you&apos;ll gain access to a special power that
                  manipulates the fabric of space-time itself.
                </p>
              </div>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
}
