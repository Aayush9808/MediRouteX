/**
 * Dijkstra's Algorithm Implementation
 * Optimal pathfinding for route calculation
 */

import { GraphNode, GraphEdge, RouteGraph, RouteSegment } from '../types';
import { calculateDistance, getTrafficMultiplier } from './helpers';

interface DijkstraNode {
  id: string;
  distance: number;
  previous: string | null;
  visited: boolean;
}

interface PathResult {
  path: string[];
  totalDistance: number;
  totalDuration: number;
}

/**
 * Dijkstra's algorithm to find shortest path
 * @param graph The route graph with nodes and edges
 * @param startId Starting node ID
 * @param endId Destination node ID
 * @returns Path with nodes, total distance and duration
 */
export function dijkstra(
  graph: RouteGraph,
  startId: string,
  endId: string
): PathResult | null {
  // Initialize distances and tracking
  const nodes = new Map<string, DijkstraNode>();
  
  for (const [nodeId] of graph.nodes) {
    nodes.set(nodeId, {
      id: nodeId,
      distance: nodeId === startId ? 0 : Infinity,
      previous: null,
      visited: false
    });
  }

  // Priority queue (using simple array, can optimize with heap)
  const unvisited = Array.from(nodes.keys());

  while (unvisited.length > 0) {
    // Get node with minimum distance
    const currentId = unvisited.reduce((minId, nodeId) => {
      const current = nodes.get(nodeId)!;
      const min = nodes.get(minId)!;
      return current.distance < min.distance ? nodeId : minId;
    });

    const current = nodes.get(currentId)!;
    
    // If we reached the destination
    if (currentId === endId) {
      break;
    }

    // If current distance is infinity, no path exists
    if (current.distance === Infinity) {
      return null;
    }

    // Mark as visited
    current.visited = true;
    unvisited.splice(unvisited.indexOf(currentId), 1);

    // Check all neighbors
    const edges = graph.edges.get(currentId) || [];
    
    for (const edge of edges) {
      const neighbor = nodes.get(edge.to);
      if (!neighbor || neighbor.visited) continue;

      // Calculate weighted distance (considering traffic)
      const weight = edge.distance_km * edge.traffic_multiplier;
      const tentativeDistance = current.distance + weight;

      if (tentativeDistance < neighbor.distance) {
        neighbor.distance = tentativeDistance;
        neighbor.previous = currentId;
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let currentId: string | null = endId;
  let totalDistance = 0;
  let totalDuration = 0;

  while (currentId !== null) {
    path.unshift(currentId);
    const currentNode: DijkstraNode = nodes.get(currentId)!;
    
    if (currentNode.previous) {
      const edge = findEdge(graph, currentNode.previous, currentId);
      if (edge) {
        totalDistance += edge.distance_km;
        totalDuration += edge.base_duration_seconds * edge.traffic_multiplier;
      }
    }
    
    currentId = currentNode.previous;
  }

  // Check if path was found
  if (path.length === 0 || path[0] !== startId) {
    return null;
  }

  return {
    path,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalDuration: Math.round(totalDuration)
  };
}

/**
 * Find edge between two nodes
 */
function findEdge(
  graph: RouteGraph,
  fromId: string,
  toId: string
): GraphEdge | null {
  const edges = graph.edges.get(fromId) || [];
  return edges.find(e => e.to === toId) || null;
}

/**
 * A* algorithm (optimized Dijkstra with heuristic)
 * Better for large graphs when destination is known
 */
export function aStar(
  graph: RouteGraph,
  startId: string,
  endId: string
): PathResult | null {
  const startNode = graph.nodes.get(startId);
  const endNode = graph.nodes.get(endId);
  
  if (!startNode || !endNode) return null;

  // Calculate heuristic (straight-line distance to goal)
  const heuristic = (nodeId: string): number => {
    const node = graph.nodes.get(nodeId);
    if (!node) return Infinity;
    return calculateDistance(node.location, endNode.location);
  };

  const openSet = new Set([startId]);
  const closedSet = new Set<string>();
  
  const gScore = new Map<string, number>([[startId, 0]]);
  const fScore = new Map<string, number>([[startId, heuristic(startId)]]);
  const cameFrom = new Map<string, string>();

  while (openSet.size > 0) {
    // Get node with lowest fScore
    let current = Array.from(openSet).reduce((lowest, nodeId) => {
      const fCurrent = fScore.get(nodeId) ?? Infinity;
      const fLowest = fScore.get(lowest) ?? Infinity;
      return fCurrent < fLowest ? nodeId : lowest;
    });

    // Found destination
    if (current === endId) {
      return reconstructPath(graph, cameFrom, current, gScore);
    }

    openSet.delete(current);
    closedSet.add(current);

    // Check neighbors
    const edges = graph.edges.get(current) || [];
    
    for (const edge of edges) {
      if (closedSet.has(edge.to)) continue;

      const tentativeG = (gScore.get(current) ?? Infinity) + 
                         (edge.distance_km * edge.traffic_multiplier);

      if (!openSet.has(edge.to)) {
        openSet.add(edge.to);
      } else if (tentativeG >= (gScore.get(edge.to) ?? Infinity)) {
        continue;
      }

      cameFrom.set(edge.to, current);
      gScore.set(edge.to, tentativeG);
      fScore.set(edge.to, tentativeG + heuristic(edge.to));
    }
  }

  return null; // No path found
}

/**
 * Reconstruct path from A* result
 */
function reconstructPath(
  graph: RouteGraph,
  cameFrom: Map<string, string>,
  current: string,
  _gScore: Map<string, number>
): PathResult {
  const path = [current];
  let totalDistance = 0;
  let totalDuration = 0;

  while (cameFrom.has(current)) {
    const previous = cameFrom.get(current)!;
    path.unshift(previous);
    
    const edge = findEdge(graph, previous, current);
    if (edge) {
      totalDistance += edge.distance_km;
      totalDuration += edge.base_duration_seconds * edge.traffic_multiplier;
    }
    
    current = previous;
  }

  return {
    path,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalDuration: Math.round(totalDuration)
  };
}

/**
 * Build route graph from database road segments
 * This is a simplified version - real implementation would load from DB
 */
export function buildRouteGraph(
  roadSegments: Array<{
    from_lat: number;
    from_lng: number;
    to_lat: number;
    to_lng: number;
    distance_km: number;
    road_type: string;
    traffic_level: string;
  }>
): RouteGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge[]>();

  // Create nodes and edges from road segments
  for (const segment of roadSegments) {
    const fromId = `${segment.from_lat},${segment.from_lng}`;
    const toId = `${segment.to_lat},${segment.to_lng}`;

    // Add nodes if not exist
    if (!nodes.has(fromId)) {
      nodes.set(fromId, {
        id: fromId,
        location: { latitude: segment.from_lat, longitude: segment.from_lng },
        type: 'intersection'
      });
    }
    if (!nodes.has(toId)) {
      nodes.set(toId, {
        id: toId,
        location: { latitude: segment.to_lat, longitude: segment.to_lng },
        type: 'intersection'
      });
    }

    // Add edge
    const trafficMultiplier = getTrafficMultiplier(segment.traffic_level as any) || 1.0;
    const baseSpeed = getRoadTypeSpeed(segment.road_type);
    const baseDuration = (segment.distance_km / baseSpeed) * 3600; // seconds

    const edge: GraphEdge = {
      from: fromId,
      to: toId,
      distance_km: segment.distance_km,
      base_duration_seconds: baseDuration,
      traffic_multiplier: trafficMultiplier,
      road_type: segment.road_type as any,
      traffic_level: segment.traffic_level as any
    };

    if (!edges.has(fromId)) {
      edges.set(fromId, []);
    }
    edges.get(fromId)!.push(edge);

    // Add reverse edge for bidirectional roads
    const reverseEdge: GraphEdge = { ...edge, from: toId, to: fromId };
    if (!edges.has(toId)) {
      edges.set(toId, []);
    }
    edges.get(toId)!.push(reverseEdge);
  }

  return { nodes, edges };
}

/**
 * Get typical speed for road type (km/h)
 */
function getRoadTypeSpeed(roadType: string): number {
  const speeds: Record<string, number> = {
    highway: 100,
    main_road: 60,
    street: 40,
    residential: 30
  };
  return speeds[roadType] || 50;
}

/**
 * Find K shortest paths (Yen's algorithm simplified)
 * Returns multiple alternative routes
 */
export function findKShortestPaths(
  graph: RouteGraph,
  startId: string,
  endId: string,
  k: number = 3
): PathResult[] {
  const paths: PathResult[] = [];
  
  // Find first shortest path
  const firstPath = dijkstra(graph, startId, endId);
  if (!firstPath) return paths;
  
  paths.push(firstPath);

  // Find alternative paths (simplified - just use A* as alternative)
  if (k > 1) {
    const altPath = aStar(graph, startId, endId);
    if (altPath && altPath.path.join() !== firstPath.path.join()) {
      paths.push(altPath);
    }
  }

  return paths.slice(0, k);
}

/**
 * Calculate route segments from node path
 */
export function pathToSegments(
  graph: RouteGraph,
  path: string[]
): RouteSegment[] {
  const segments: RouteSegment[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const fromNode = graph.nodes.get(path[i])!;
    const toNode = graph.nodes.get(path[i + 1])!;
    const edge = findEdge(graph, path[i], path[i + 1]);

    if (edge) {
      segments.push({
        start: fromNode.location,
        end: toNode.location,
        distance_km: edge.distance_km,
        duration_seconds: edge.base_duration_seconds * edge.traffic_multiplier,
        road_name: `Road ${i + 1}` // Would come from DB in real implementation
      });
    }
  }

  return segments;
}
