import { Bus, Car, Footprints, Motorbike } from "lucide-react"
export const transports = [
  ["CAR", "Car", Car],
  ["BUS", "Bus", Bus],
  ["FOOT", "On foot", Footprints],
  ["BODA", "Boda", Motorbike],
]
export const transportLabels = Object.fromEntries(transports)
