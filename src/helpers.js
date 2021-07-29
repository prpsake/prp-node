/* Helpers */
import fs from 'fs-extra'



export const copyDir = async (src, dest) => {
  const existsSrc = await fs.pathExists(src)
  if (existsSrc) await fs.copy(src, dest)
}



export default { copyDir }