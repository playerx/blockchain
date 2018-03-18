import { Block } from "../../model";

export const findBlock = ({ index, hash }) => (state: Block[]) => {
	const noIndexFilter = !index && (index !== 0)

	return state.filter(x =>
		(noIndexFilter || x.index === index) &&
		(!hash || x.hash === hash)
	)[0]
}

export const getBlockId = (block: Block) => `${block.index}_${block.hash}`
